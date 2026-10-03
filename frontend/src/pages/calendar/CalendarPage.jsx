import { useCallback, useState } from 'react';
import enGbLocale from '@fullcalendar/core/locales/en-gb';
import frLocale from '@fullcalendar/core/locales/fr';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import { useTranslation } from 'react-i18next';
import apiClient, { getErrorMessageKey } from '../../api/apiClient.js';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ResourceState from '../../components/ResourceState.jsx';
import TextField from '../../components/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { useApiResource } from '../../hooks/useApiResource.js';
import { fieldMessage } from '../../utils/fields.js';
import { formatDateOnly } from '../../utils/format.js';
import styles from '../module.module.css';
import calendarStyles from './CalendarPage.module.css';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const EMPTY_EVENT = { title: '', date: '', time: '', description: '' };

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const householdId = user?.householdId;
  const [month, setMonth] = useState(currentMonth);
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState(EMPTY_EVENT);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  useDocumentTitle(t('pages.calendar.title'));

  const load = useCallback(
    async (signal) => {
      const { data } = await apiClient.get(`/households/${householdId}/events`, {
        signal,
        params: { month },
      });
      return data.events;
    },
    [householdId, month],
  );
  const { status, data, error, retry } = useApiResource(load);
  const events = data ?? [];

  function handleDates(info) {
    const start = info.view.currentStart;
    const next = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    setMonth((current) => (current === next ? current : next));
  }

  function openCreate(date) {
    setEditor({ mode: 'create' });
    setDraft({ ...EMPTY_EVENT, date: date || `${month}-01` });
    setFieldErrors({});
    setFormError(null);
    setSuccess('');
  }

  function openEvent(eventId) {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;
    setEditor({ mode: 'details', event });
    setFormError(null);
  }

  function openEdit(event) {
    setEditor({ mode: 'edit', event });
    setDraft({
      title: event.title,
      date: event.date,
      time: event.time ?? '',
      description: event.description ?? '',
    });
    setFieldErrors({});
    setFormError(null);
  }

  async function saveEvent(submitEvent) {
    submitEvent.preventDefault();
    if (!draft.title.trim() || !draft.date) {
      setFieldErrors({
        title: draft.title.trim() ? undefined : t('validation.required'),
        date: draft.date ? undefined : t('validation.required'),
      });
      return;
    }
    setSaving(true);
    setFormError(null);
    const body = {
      title: draft.title.trim(),
      date: draft.date,
      time: draft.time,
      description: draft.description.trim(),
    };
    try {
      if (editor.mode === 'edit') {
        await apiClient.put(`/households/${householdId}/events/${editor.event.id}`, body);
        setSuccess(t('calendarPage.updated'));
      } else {
        await apiClient.post(`/households/${householdId}/events`, body);
        setSuccess(t('calendarPage.created'));
      }
      setEditor(null);
      retry();
    } catch (saveError) {
      setFormError(saveError);
      setFieldErrors({
        title: fieldMessage(t, saveError, 'title'),
        date: fieldMessage(t, saveError, 'date'),
        time: fieldMessage(t, saveError, 'time'),
        description: fieldMessage(t, saveError, 'description'),
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent() {
    if (!pendingDelete) return;
    setSaving(true);
    try {
      await apiClient.delete(`/households/${householdId}/events/${pendingDelete.id}`);
      setPendingDelete(null);
      setEditor(null);
      setSuccess(t('calendarPage.deleted'));
      retry();
    } catch (deleteError) {
      setFormError(deleteError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={t('pages.calendar.title')}
        description={t('pages.calendar.description')}
        motif="calendar"
        actions={<Button onClick={() => openCreate()}>{t('calendarPage.add')}</Button>}
      />
      {success && <Alert tone="success">{success}</Alert>}
      <ResourceState
        status={status}
        error={error}
        onRetry={retry}
        loadingLabel={t('calendarPage.loading')}
        errorTitle={t('calendarPage.errorTitle')}
      >
        <section className={styles.card} aria-labelledby="calendar-title">
          <h2 id="calendar-title" className={styles.sectionTitle}>
            {t('calendarPage.month')}
          </h2>
          {events.length === 0 && <p className={styles.hint}>{t('calendarPage.empty')}</p>}
          <div className={calendarStyles.calendar}>
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              initialDate={`${month}-01`}
              locales={[frLocale, enGbLocale]}
              locale={i18n.language === 'fr' ? 'fr' : 'en-gb'}
              headerToolbar={{ left: 'prev,next', center: 'title', right: 'today' }}
              height="auto"
              events={events.map((event) => ({
                id: event.id,
                title: event.title,
                start: event.time ? `${event.date}T${event.time}` : event.date,
                allDay: !event.time,
              }))}
              datesSet={handleDates}
              eventClick={(info) => openEvent(info.event.id)}
              dateClick={(info) => openCreate(info.dateStr.slice(0, 10))}
            />
          </div>
        </section>
      </ResourceState>

      <Modal
        open={editor?.mode === 'details'}
        onClose={() => setEditor(null)}
        title={editor?.event?.title ?? ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => openEdit(editor.event)}>
              {t('calendarPage.edit')}
            </Button>
            <Button variant="danger" onClick={() => setPendingDelete(editor.event)}>
              {t('calendarPage.delete')}
            </Button>
          </>
        }
      >
        {editor?.event && (
          <div className={styles.stack}>
            <p>
              {formatDateOnly(editor.event.date, i18n.language)}
              {editor.event.time ? ` · ${editor.event.time}` : ''}
            </p>
            {editor.event.description && <p>{editor.event.description}</p>}
          </div>
        )}
      </Modal>

      <Modal
        open={editor?.mode === 'create' || editor?.mode === 'edit'}
        onClose={() => setEditor(null)}
        title={t(editor?.mode === 'edit' ? 'calendarPage.editTitle' : 'calendarPage.addTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditor(null)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={saveEvent} loading={saving} disabled={saving}>
              {t('calendarPage.save')}
            </Button>
          </>
        }
      >
        <form className={styles.form} onSubmit={saveEvent}>
          {formError && <Alert tone="error">{t(getErrorMessageKey(formError))}</Alert>}
          <TextField
            label={t('calendarPage.fields.title')}
            error={fieldErrors.title}
            value={draft.title}
            maxLength={200}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            required
          />
          <TextField
            label={t('calendarPage.fields.date')}
            error={fieldErrors.date}
            type="date"
            value={draft.date}
            min="2000-01-01"
            max="2100-12-31"
            onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
            required
          />
          <TextField
            label={t('calendarPage.fields.time')}
            hint={t('calendarPage.fields.timeHint')}
            error={fieldErrors.time}
            type="time"
            value={draft.time}
            onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))}
          />
          <TextField
            label={t('calendarPage.fields.description')}
            error={fieldErrors.description}
            value={draft.description}
            maxLength={2000}
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          />
        </form>
      </Modal>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title={t('calendarPage.deleteTitle')}
        description={t('calendarPage.deleteBody')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={removeEvent} loading={saving} disabled={saving}>
              {t('calendarPage.delete')}
            </Button>
          </>
        }
      >
        {formError && pendingDelete && <Alert tone="error">{t(getErrorMessageKey(formError))}</Alert>}
      </Modal>
    </>
  );
}
