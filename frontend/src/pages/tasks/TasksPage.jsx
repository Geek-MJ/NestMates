import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient, { getErrorMessageKey } from '../../api/apiClient.js';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import Checkbox from '../../components/Checkbox.jsx';
import Modal from '../../components/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ResourceState from '../../components/ResourceState.jsx';
import SelectField from '../../components/SelectField.jsx';
import TextField from '../../components/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { useApiResource } from '../../hooks/useApiResource.js';
import { fieldMessage, personName } from '../../utils/fields.js';
import { formatDateOnly } from '../../utils/format.js';
import styles from '../module.module.css';

const EMPTY = { title: '', assigneeId: '', dueDate: '' };

export default function TasksPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const householdId = user?.householdId;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useDocumentTitle(t('pages.tasks.title'));

  const load = useCallback(
    async (signal) => {
      const [household, tasks] = await Promise.all([
        apiClient.get(`/households/${householdId}`, { signal }),
        apiClient.get(`/households/${householdId}/tasks`, { signal }),
      ]);
      return { members: household.data.members ?? [], tasks: tasks.data.tasks ?? [] };
    },
    [householdId],
  );
  const { status, data, error, retry } = useApiResource(load);
  const members = data?.members ?? [];
  const tasks = data?.tasks ?? [];

  function openForm() {
    setForm({ ...EMPTY, assigneeId: user.id, dueDate: '' });
    setFieldErrors({});
    setFormError(null);
    setSuccess('');
    setOpen(true);
  }

  async function submitTask(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = t('validation.required');
    if (!form.assigneeId) nextErrors.assigneeId = t('validation.required');
    if (!form.dueDate) nextErrors.dueDate = t('validation.required');
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      await apiClient.post(`/households/${householdId}/tasks`, {
        title: form.title.trim(),
        assigneeId: form.assigneeId,
        dueDate: form.dueDate,
      });
      setOpen(false);
      setSuccess(t('tasksPage.created'));
      retry();
    } catch (submitError) {
      setFormError(submitError);
      setFieldErrors({
        title: fieldMessage(t, submitError, 'title'),
        assigneeId: fieldMessage(t, submitError, 'assigneeId'),
        dueDate: fieldMessage(t, submitError, 'dueDate'),
      });
    } finally {
      setSaving(false);
    }
  }

  async function markDone(task) {
    if (task.status === 'DONE') return;
    setUpdatingId(task.id);
    setSuccess('');
    try {
      await apiClient.patch(`/households/${householdId}/tasks/${task.id}`, { status: 'DONE' });
      setSuccess(t('tasksPage.completed'));
      retry();
    } catch (updateError) {
      setFormError(updateError);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title={t('pages.tasks.title')}
        description={t('pages.tasks.description')}
        motif="tasks"
        actions={
          <Button onClick={openForm} disabled={status !== 'ready'}>
            {t('tasksPage.add')}
          </Button>
        }
      />
      {success && <Alert tone="success">{success}</Alert>}
      {formError && !open && <Alert tone="error">{t(getErrorMessageKey(formError))}</Alert>}
      <ResourceState
        status={status}
        error={error}
        onRetry={retry}
        loadingLabel={t('tasksPage.loading')}
        errorTitle={t('tasksPage.errorTitle')}
      >
        {tasks.length === 0 ? (
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>{t('tasksPage.emptyTitle')}</h2>
            <p className={styles.hint}>{t('tasksPage.empty')}</p>
          </section>
        ) : (
          <section className={styles.card} aria-labelledby="tasks-title">
            <h2 id="tasks-title" className={styles.sectionTitle}>
              {t('tasksPage.listTitle')}
            </h2>
            <ul className={styles.list}>
              {tasks.map((task) => (
                <li key={task.id} className={styles.row}>
                  <Checkbox
                    label={task.title}
                    checked={task.status === 'DONE'}
                    disabled={task.status === 'DONE' || updatingId === task.id}
                    onChange={() => markDone(task)}
                  />
                  <div className={styles.rowMain}>
                    <span className={styles.meta}>
                      {t('tasksPage.meta', {
                        assignee: personName(task.assignee, t),
                        date: formatDateOnly(task.dueDate, i18n.language),
                        status: t(`tasksPage.status.${task.status}`),
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </ResourceState>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('tasksPage.addTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submitTask} loading={saving} disabled={saving}>
              {t('tasksPage.submit')}
            </Button>
          </>
        }
      >
        <form className={styles.form} onSubmit={submitTask}>
          {formError && <Alert tone="error">{t(getErrorMessageKey(formError))}</Alert>}
          <TextField
            label={t('tasksPage.fields.title')}
            error={fieldErrors.title}
            value={form.title}
            maxLength={200}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            required
          />
          <SelectField
            label={t('tasksPage.fields.assignee')}
            error={fieldErrors.assigneeId}
            value={form.assigneeId}
            onChange={(event) => setForm((current) => ({ ...current, assigneeId: event.target.value }))}
            required
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </SelectField>
          <TextField
            label={t('tasksPage.fields.dueDate')}
            error={fieldErrors.dueDate}
            type="date"
            value={form.dueDate}
            min="2000-01-01"
            max="2100-12-31"
            onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
            required
          />
        </form>
      </Modal>
    </>
  );
}
