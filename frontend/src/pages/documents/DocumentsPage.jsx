import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import apiClient, { getErrorMessageKey } from '../../api/apiClient.js';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import Modal from '../../components/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ResourceState from '../../components/ResourceState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { useApiResource } from '../../hooks/useApiResource.js';
import { personName } from '../../utils/fields.js';
import { formatDate, formatFileSize } from '../../utils/format.js';
import styles from '../module.module.css';
import local from './DocumentsPage.module.css';

const TYPE_KEYS = {
  'application/pdf': 'documentsPage.types.pdf',
  'image/jpeg': 'documentsPage.types.jpeg',
  'image/png': 'documentsPage.types.png',
};

export default function DocumentsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const householdId = user?.householdId;
  const inputRef = useRef(null);
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [viewer, setViewer] = useState(null);
  const viewerUrl = useRef(null);
  const pdfUrls = useRef([]);

  useDocumentTitle(t('pages.documents.title'));

  useEffect(() => {
    function release() {
      if (viewerUrl.current) URL.revokeObjectURL(viewerUrl.current);
      for (const url of pdfUrls.current) URL.revokeObjectURL(url);
    }
    window.addEventListener('pagehide', release);
    return () => {
      window.removeEventListener('pagehide', release);
      if (viewerUrl.current) URL.revokeObjectURL(viewerUrl.current);
    };
  }, []);

  const load = useCallback(
    async (signal) => {
      const { data } = await apiClient.get(`/households/${householdId}/documents`, {
        signal,
        params: { page },
      });
      return data;
    },
    [householdId, page],
  );
  const { status, data, error, retry } = useApiResource(load);

  async function uploadFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setMessage(null);
    const body = new FormData();
    body.append('file', file);
    try {
      await apiClient.post(`/households/${householdId}/documents`, body);
      setMessage({ tone: 'success', text: t('documentsPage.uploaded') });
      setPage(1);
      retry();
    } catch (uploadError) {
      setMessage({
        tone: 'error',
        text: t(
          getErrorMessageKey(uploadError, {
            FILE_TOO_LARGE: 'documentsPage.tooLarge',
            UNSUPPORTED_TYPE: 'documentsPage.unsupported',
          }),
        ),
      });
    } finally {
      setUploading(false);
    }
  }

  async function fetchBlob(documentId, disposition) {
    const response = await apiClient.get(`/households/${householdId}/documents/${documentId}/content`, {
      params: disposition ? { disposition } : undefined,
      responseType: 'blob',
    });
    return response.data;
  }

  // Keep the backend Content-Type. Fall back to the type stored with the document
  // only when the blob arrives without one, so a PNG stays an image and a PDF stays a PDF.
  function fileBlob(data, mimeType) {
    if (data instanceof Blob && data.type) return data;
    return new Blob([data], { type: mimeType || 'application/octet-stream' });
  }

  function downloadFileName(fileName) {
    const cleaned = [...String(fileName ?? '')]
      .map((character) => {
        const code = character.codePointAt(0);
        if (code <= 31 || code === 127 || character === '"' || character === '\\' || character === '/') return '_';
        return character;
      })
      .join('')
      .trim()
      .slice(0, 180);
    return cleaned || 'document';
  }

  function closeViewer() {
    const url = viewerUrl.current;
    viewerUrl.current = null;
    setViewer(null);
    // Revoke after the frame has been removed, not while it is still showing the file.
    if (url) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  useEffect(() => {
    if (!viewer) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') closeViewer();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewer]);

  function showViewer(url, name, kind) {
    const previous = viewerUrl.current;
    viewerUrl.current = url;
    setViewer({ url, name, kind });
    if (previous) window.setTimeout(() => URL.revokeObjectURL(previous), 1000);
  }

  async function viewDocument(document) {
    setMessage(null);
    const hinted = (document.mimeType || '').split(';')[0].trim().toLowerCase();
    const image = hinted === 'image/png' || hinted === 'image/jpeg';
    // Open the tab during the click, before the request. Passing a blob URL to
    // window.open, especially with `noopener`, is what Chrome turns into a Google search.
    const opened = image ? null : window.open('', '_blank');
    if (!image && !opened) setMessage({ tone: 'error', text: t('documentsPage.popupBlocked') });
    setBusyId(document.id);
    try {
      const blob = fileBlob(await fetchBlob(document.id), document.mimeType);
      const url = URL.createObjectURL(blob);
      const type = (blob.type || hinted).split(';')[0].trim().toLowerCase();
      if (type === 'image/png' || type === 'image/jpeg') {
        if (opened && !opened.closed) opened.close();
        showViewer(url, document.fileName, 'image');
        return;
      }
      if (opened && !opened.closed) {
        opened.location.replace(url);
        pdfUrls.current.push(url);
        return;
      }
      showViewer(url, document.fileName, 'pdf');
    } catch (viewError) {
      if (opened && !opened.closed) opened.close();
      setMessage({ tone: 'error', text: t(getErrorMessageKey(viewError)) });
    } finally {
      setBusyId(null);
    }
  }

  async function downloadDocument(document) {
    setBusyId(document.id);
    setMessage(null);
    try {
      const blob = fileBlob(await fetchBlob(document.id, 'attachment'), document.mimeType);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = downloadFileName(document.fileName);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (downloadError) {
      setMessage({ tone: 'error', text: t(getErrorMessageKey(downloadError)) });
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/households/${householdId}/documents/${pendingDelete.id}`);
      setPendingDelete(null);
      setMessage({ tone: 'success', text: t('documentsPage.deleted') });
      retry();
    } catch (deleteError) {
      setMessage({ tone: 'error', text: t(getErrorMessageKey(deleteError)) });
    } finally {
      setDeleting(false);
    }
  }

  const documents = data?.items ?? [];

  return (
    <>
      <PageHeader
        title={t('pages.documents.title')}
        description={t('pages.documents.description')}
        motif="documents"
        actions={
          <>
            <input
              ref={inputRef}
              className={local.fileInput}
              type="file"
              accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
              aria-label={t('documentsPage.upload')}
              onChange={uploadFile}
            />
            <Button onClick={() => inputRef.current?.click()} loading={uploading} disabled={uploading}>
              {t('documentsPage.upload')}
            </Button>
          </>
        }
      />
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <p className={styles.hint}>{t('documentsPage.hint')}</p>
      <ResourceState
        status={status}
        error={error}
        onRetry={retry}
        loadingLabel={t('documentsPage.loading')}
        errorTitle={t('documentsPage.errorTitle')}
      >
        {documents.length === 0 ? (
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>{t('documentsPage.emptyTitle')}</h2>
            <p className={styles.hint}>{t('documentsPage.empty')}</p>
          </section>
        ) : (
          <section className={styles.card} aria-labelledby="documents-title">
            <h2 id="documents-title" className={styles.sectionTitle}>
              {t('documentsPage.listTitle')}
            </h2>
            <ul className={styles.list}>
              {documents.map((document) => (
                <li key={document.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <span className={styles.rowTitle}>{document.fileName}</span>
                    <span className={styles.meta}>
                      {t(TYPE_KEYS[document.mimeType] ?? 'documentsPage.types.other')}
                      {' · '}
                      {formatFileSize(document.size, i18n.language)}
                      {' · '}
                      {personName(document.uploadedBy, t)}
                      {' · '}
                      {formatDate(document.uploadedAt, i18n.language)}
                    </span>
                  </div>
                  <div className={styles.actions}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => viewDocument(document)}
                      loading={busyId === document.id}
                      disabled={busyId === document.id}
                    >
                      {t('documentsPage.view')}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => downloadDocument(document)}>
                      {t('documentsPage.download')}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setPendingDelete(document)}>
                      {t('documentsPage.delete')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            {data.page < data.totalPages && (
              <div className={styles.pager}>
                <Button variant="secondary" size="sm" onClick={() => setPage((current) => current + 1)}>
                  {t('common.loadMore')}
                </Button>
              </div>
            )}
          </section>
        )}
      </ResourceState>

      {viewer && createPortal(
        <div className={local.viewer} role="dialog" aria-modal="true" aria-labelledby="document-viewer-title">
          <div className={local.viewerBar}>
            <h2 id="document-viewer-title" className={local.viewerTitle}>
              {viewer.name}
            </h2>
            <button type="button" className={local.viewerClose} onClick={closeViewer} aria-label={t('a11y.close')}>
              <Icon name="close" size={20} />
            </button>
          </div>
          {viewer.kind === 'image' ? (
            <img className={local.viewerImage} src={viewer.url} alt={viewer.name} />
          ) : (
            <iframe className={local.viewerFrame} src={viewer.url} title={viewer.name} />
          )}
        </div>,
        document.body,
      )}

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title={t('documentsPage.deleteTitle')}
        description={t('documentsPage.deleteBody', { name: pendingDelete?.fileName ?? '' })}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={deleting}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting} disabled={deleting}>
              {t('documentsPage.delete')}
            </Button>
          </>
        }
      />
    </>
  );
}
