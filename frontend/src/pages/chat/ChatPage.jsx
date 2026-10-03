import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient, { getErrorMessageKey, tokenStorage } from '../../api/apiClient.js';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ResourceState from '../../components/ResourceState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { useApiResource } from '../../hooks/useApiResource.js';
import { connectSocket, getSocket } from '../../socket/socketClient.js';
import { personName } from '../../utils/fields.js';
import { formatDate } from '../../utils/format.js';
import styles from '../module.module.css';
import local from './ChatPage.module.css';

function viewerLanguage(language) {
  const base = String(language ?? '').toLowerCase().split('-')[0];
  return base === 'en' || base === 'fr' ? base : null;
}

function MessageCard({ message, mine, householdId, language }) {
  const { t, i18n } = useTranslation();
  const source = message.sourceLang === 'en' || message.sourceLang === 'fr' ? message.sourceLang : null;
  const target = viewerLanguage(language);
  const canTranslate = Boolean(source && target && source !== target);
  const [view, setView] = useState({ mode: 'original', translatedText: '' });

  async function translate() {
    if (!canTranslate || view.mode === 'translating') return;
    setView((current) => ({ ...current, mode: 'translating' }));
    try {
      const { data } = await apiClient.post(
        `/households/${householdId}/messages/${message.id}/translate`,
        { targetLanguage: target },
      );
      if (!data?.translatedText || data.originalText !== message.originalText) {
        setView({ mode: 'error', translatedText: '' });
        return;
      }
      setView({ mode: 'translated', translatedText: data.translatedText });
    } catch {
      setView({ mode: 'error', translatedText: '' });
    }
  }

  const showingTranslation = view.mode === 'translated' && view.translatedText;

  return (
    <li className={mine ? local.mine : local.theirs}>
      <p className={local.meta}>
        <span className={local.sender}>{personName(message.sender, t)}</span>
        <time dateTime={message.createdAt}>
          {formatDate(message.createdAt, i18n.language, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </time>
      </p>
      <p className={local.text}>{showingTranslation ? view.translatedText : message.originalText}</p>
      {view.mode === 'translating' && <p className={local.status}>{t('chatPage.translating')}</p>}
      {view.mode === 'error' && (
        <p className={local.status}>
          {t('chatPage.translationUnavailable')}
          {' '}
          <button type="button" className={local.action} onClick={translate}>
            {t('chatPage.retry')}
          </button>
        </p>
      )}
      {showingTranslation && (
        <button type="button" className={local.action} onClick={() => setView((current) => ({ ...current, mode: 'original' }))}>
          {t('chatPage.seeOriginal')}
        </button>
      )}
      {canTranslate && view.mode === 'original' && (
        <button type="button" className={local.action} onClick={translate}>
          {t(`chatPage.translateTo.${target}`)}
        </button>
      )}
    </li>
  );
}

function Conversation({ history, householdId, userId, language }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState(history.messages ?? []);
  const [hasMore, setHasMore] = useState(Boolean(history.hasMore));
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [typing, setTyping] = useState({});
  const [loadingOlder, setLoadingOlder] = useState(false);
  const lastTypingEmit = useRef(0);
  const bottomRef = useRef(null);
  const newestId = messages.at(-1)?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [newestId]);

  useEffect(() => {
    const socket = connectSocket(tokenStorage.get());
    if (!socket) return undefined;

    function onMessage(payload) {
      const message = payload?.message;
      if (!message?.id) return;
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
      setTyping((current) => {
        if (!current[message.sender?.id]) return current;
        const next = { ...current };
        delete next[message.sender.id];
        return next;
      });
    }

    function onTyping(payload) {
      if (!payload?.userId || payload.userId === userId) return;
      setTyping((current) => ({
        ...current,
        [payload.userId]: { name: payload.name, at: Date.now() },
      }));
    }

    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);
    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
    };
  }, [userId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setTyping((current) => {
        const next = {};
        for (const [id, value] of Object.entries(current)) {
          if (now - value.at < 3000) next[id] = value;
        }
        return Object.keys(next).length === Object.keys(current).length ? current : next;
      });
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  function handleChange(event) {
    const value = event.target.value;
    setText(value);
    const socket = getSocket();
    const now = Date.now();
    if (socket && value.trim() && now - lastTypingEmit.current >= 2000) {
      lastTypingEmit.current = now;
      socket.emit('chat:typing');
    }
  }

  function sendMessage(event) {
    event.preventDefault();
    const socket = getSocket();
    const value = text.trim();
    if (!socket || !value || sending) return;
    setSending(true);
    setSendError(null);
    socket.timeout(10000).emit('chat:send', { text: value }, (timeoutError, response) => {
      setSending(false);
      if (timeoutError) {
        setSendError({ code: 'TIMEOUT' });
        return;
      }
      if (response?.error) {
        setSendError(response.error);
        return;
      }
      if (response?.message) {
        setMessages((current) =>
          current.some((item) => item.id === response.message.id) ? current : [...current, response.message],
        );
      }
      setText('');
    });
  }

  async function loadOlder() {
    const oldest = messages[0];
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true);
    setSendError(null);
    try {
      const { data: older } = await apiClient.get(`/households/${householdId}/messages`, {
        params: { before: oldest.createdAt },
      });
      setHasMore(Boolean(older.hasMore));
      setMessages((current) => {
        const seen = new Set(current.map((item) => item.id));
        const prefix = (older.messages ?? []).filter((item) => !seen.has(item.id));
        return [...prefix, ...current];
      });
    } catch (loadError) {
      setSendError(loadError);
    } finally {
      setLoadingOlder(false);
    }
  }

  const typingNames = Object.values(typing).map((value) => value.name).filter(Boolean);

  return (
    <section className={`${styles.card} ${local.panel}`} aria-labelledby="chat-title">
      <h2 id="chat-title" className={styles.sectionTitle}>
        {t('chatPage.history')}
      </h2>
      {hasMore && (
        <Button variant="secondary" size="sm" onClick={loadOlder} loading={loadingOlder} disabled={loadingOlder}>
          {t('chatPage.loadOlder')}
        </Button>
      )}
      {messages.length === 0 ? (
        <p className={styles.hint}>{t('chatPage.empty')}</p>
      ) : (
        <ol className={local.messages}>
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              mine={message.sender?.id === userId}
              householdId={householdId}
              language={language}
            />
          ))}
        </ol>
      )}
      <div ref={bottomRef} />
      <p className={local.typing} role="status" aria-live="polite">
        {typingNames.length > 0 ? typingNames.map((name) => t('chatPage.typing', { name })).join(' ') : ''}
      </p>
      {sendError && (
        <Alert tone="error">{t(getErrorMessageKey(sendError, { CHAT_RATE_LIMIT: 'chatPage.rateLimit' }))}</Alert>
      )}
      <form className={local.composer} onSubmit={sendMessage}>
        <label className={local.label} htmlFor="chat-message">
          {t('chatPage.messageLabel')}
        </label>
        <textarea
          id="chat-message"
          className={local.input}
          rows={3}
          maxLength={1000}
          value={text}
          onChange={handleChange}
          placeholder={t('chatPage.placeholder')}
        />
        <Button type="submit" loading={sending} disabled={sending || text.trim().length === 0}>
          {t('chatPage.send')}
        </Button>
      </form>
    </section>
  );
}

export default function ChatPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const householdId = user?.householdId;

  useDocumentTitle(t('pages.chat.title'));

  const load = useCallback(
    async (signal) => {
      const { data } = await apiClient.get(`/households/${householdId}/messages`, { signal });
      return data;
    },
    [householdId],
  );
  const { status, data, error, retry } = useApiResource(load);

  return (
    <>
      <PageHeader title={t('pages.chat.title')} description={t('pages.chat.description')} motif="chat" />
      <ResourceState
        status={status}
        error={error}
        onRetry={retry}
        loadingLabel={t('chatPage.loading')}
        errorTitle={t('chatPage.errorTitle')}
      >
        {data && (
          <Conversation
            history={data}
            householdId={householdId}
            userId={user.id}
            language={user.language}
          />
        )}
      </ResourceState>
    </>
  );
}
