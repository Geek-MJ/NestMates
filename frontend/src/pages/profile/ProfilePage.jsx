import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient, { getErrorMessageKey } from '../../api/apiClient.js';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import LanguageSwitch from '../../components/LanguageSwitch.jsx';
import Modal from '../../components/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import TextField from '../../components/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import {
  focusFirstInvalidField,
  hasErrors,
  validateEmail,
  validatePassword,
  validateRequired,
} from '../../utils/validation.js';
import styles from './ProfilePage.module.css';

const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;

function DetailsForm() {
  const { t } = useTranslation();
  const { user, applyUser } = useAuth();
  const formRef = useRef(null);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [errors, setErrors] = useState({});
  const [submitErrorKey, setSubmitErrorKey] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nextName = name.trim();
  const nextEmail = email.trim().toLowerCase();
  const dirty = nextName !== user.name || nextEmail !== user.email;

  function handleChange(event) {
    const { name: field, value } = event.target;
    if (field === 'name') setName(value);
    if (field === 'email') setEmail(value);
    setErrors((current) => ({ ...current, [field]: null }));
    setSuccess(false);
    setSubmitErrorKey(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {
      name: validateRequired(name),
      email: validateEmail(email),
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      focusFirstInvalidField(formRef.current);
      return;
    }
    if (!dirty) return;

    setSubmitting(true);
    setSubmitErrorKey(null);
    setSuccess(false);
    try {
      const { data } = await apiClient.patch('/users/me', { name: nextName, email: nextEmail });
      applyUser(data);
      setName(data.name);
      setEmail(data.email);
      setSuccess(true);
    } catch (error) {
      setSubmitErrorKey(
        getErrorMessageKey(error, { EMAIL_TAKEN: 'profileSettings.details.emailTaken' }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="profile-details-title">
      <h2 id="profile-details-title" className={styles.sectionTitle}>
        {t('profileSettings.details.title')}
      </h2>
      <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
        {submitErrorKey && <Alert tone="error">{t(submitErrorKey)}</Alert>}
        {success && <Alert tone="success">{t('profileSettings.details.success')}</Alert>}
        <TextField
          label={t('auth.register.name')}
          name="name"
          autoComplete="name"
          maxLength={NAME_MAX_LENGTH}
          value={name}
          onChange={handleChange}
          error={errors.name && t(errors.name)}
          required
        />
        <TextField
          label={t('auth.email')}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={EMAIL_MAX_LENGTH}
          value={email}
          onChange={handleChange}
          error={errors.email && t(errors.email)}
          required
        />
        <Button type="submit" loading={submitting} disabled={!dirty || submitting}>
          {t('profileSettings.details.submit')}
        </Button>
      </form>
    </section>
  );
}

function LanguageForm() {
  const { t } = useTranslation();
  const { user, applyUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [errorKey, setErrorKey] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleChange(language) {
    if (language === user.language || saving) return;
    setSaving(true);
    setErrorKey(null);
    setSuccess(false);
    try {
      const { data } = await apiClient.patch('/users/me', { language });
      applyUser(data);
      setSuccess(true);
    } catch (error) {
      setErrorKey(getErrorMessageKey(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="profile-language-title" aria-busy={saving || undefined}>
      <h2 id="profile-language-title" className={styles.sectionTitle}>
        {t('profileSettings.language.title')}
      </h2>
      <p className={styles.hint}>{t('profileSettings.language.description')}</p>
      {errorKey && <Alert tone="error">{t(errorKey)}</Alert>}
      {success && <Alert tone="success">{t('profileSettings.language.success')}</Alert>}
      <LanguageSwitch value={user.language} onChange={handleChange} disabled={saving} />
    </section>
  );
}

function PasswordForm() {
  const { t } = useTranslation();
  const formRef = useRef(null);
  const [values, setValues] = useState({ currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitErrorKey, setSubmitErrorKey] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: null }));
    setSuccess(false);
    setSubmitErrorKey(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {
      currentPassword: validateRequired(values.currentPassword),
      newPassword: validatePassword(values.newPassword),
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      focusFirstInvalidField(formRef.current);
      return;
    }

    setSubmitting(true);
    setSubmitErrorKey(null);
    setSuccess(false);
    try {
      await apiClient.put('/users/me/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setValues({ currentPassword: '', newPassword: '' });
      setSuccess(true);
    } catch (error) {
      setSubmitErrorKey(
        getErrorMessageKey(error, {
          CURRENT_PASSWORD_INCORRECT: 'profileSettings.password.incorrect',
        }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="profile-password-title">
      <h2 id="profile-password-title" className={styles.sectionTitle}>
        {t('profileSettings.password.title')}
      </h2>
      <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
        {submitErrorKey && <Alert tone="error">{t(submitErrorKey)}</Alert>}
        {success && <Alert tone="success">{t('profileSettings.password.success')}</Alert>}
        <TextField
          label={t('profileSettings.password.current')}
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={values.currentPassword}
          onChange={handleChange}
          error={errors.currentPassword && t(errors.currentPassword)}
          required
        />
        <TextField
          label={t('auth.reset.newPassword')}
          name="newPassword"
          type="password"
          autoComplete="new-password"
          hint={t('auth.register.passwordHint')}
          value={values.newPassword}
          onChange={handleChange}
          error={errors.newPassword && t(errors.newPassword)}
          required
        />
        <Button type="submit" loading={submitting}>
          {t('profileSettings.password.submit')}
        </Button>
      </form>
    </section>
  );
}

function DeleteAccount() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const reasonId = useId();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorKey, setErrorKey] = useState(null);
  const inHousehold = Boolean(user?.householdId);

  async function handleDelete() {
    setDeleting(true);
    setErrorKey(null);
    try {
      await apiClient.delete('/users/me');
      logout();
    } catch (error) {
      setErrorKey(
        getErrorMessageKey(error, {
          ACCOUNT_IN_HOUSEHOLD: 'profileSettings.delete.inHousehold',
        }),
      );
      setDeleting(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="profile-delete-title">
      <h2 id="profile-delete-title" className={styles.sectionTitle}>
        {t('profileSettings.delete.title')}
      </h2>
      <p className={styles.hint}>{t('profileSettings.delete.description')}</p>
      {inHousehold ? (
        <>
          <p id={reasonId} className={styles.hint}>
            {t('profileSettings.delete.inHousehold')}
          </p>
          <Button type="button" variant="danger" disabled aria-describedby={reasonId}>
            {t('profileSettings.delete.action')}
          </Button>
        </>
      ) : (
        <Button type="button" variant="danger" onClick={() => setOpen(true)}>
          {t('profileSettings.delete.action')}
        </Button>
      )}
      <Modal
        open={open}
        onClose={() => {
          if (!deleting) setOpen(false);
        }}
        title={t('profileSettings.delete.confirmTitle')}
        description={t('profileSettings.delete.confirmBody')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={deleting}>
              {t('profileSettings.delete.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              {t('profileSettings.delete.confirm')}
            </Button>
          </>
        }
      >
        {errorKey && <Alert tone="error">{t(errorKey)}</Alert>}
      </Modal>
    </section>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  useDocumentTitle(t('pages.profile.title'));

  return (
    <>
      <PageHeader title={t('pages.profile.title')} description={t('pages.profile.description')} motif="profile" />
      <div className={styles.stack}>
        <DetailsForm />
        <LanguageForm />
        <PasswordForm />
        <DeleteAccount />
      </div>
    </>
  );
}
