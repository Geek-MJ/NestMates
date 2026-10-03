import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { getErrorMessageKey } from '../../api/apiClient.js';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import TextField from '../../components/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import {
  focusFirstInvalidField,
  hasErrors,
  validateEmail,
  validateRequired,
} from '../../utils/validation.js';
import styles from './AuthForm.module.css';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, sessionExpired } = useAuth();
  const formRef = useRef(null);
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitErrorKey, setSubmitErrorKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useDocumentTitle(t('auth.login.title'));

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: null }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {
      email: validateEmail(values.email),
      password: validateRequired(values.password),
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      focusFirstInvalidField(formRef.current);
      return;
    }

    setSubmitting(true);
    setSubmitErrorKey(null);
    try {
      // On success the PublicOnly guard redirects to the requested page or the landing page.
      await login({ email: values.email.trim(), password: values.password });
    } catch (error) {
      setSubmitErrorKey(
        getErrorMessageKey(error, { UNAUTHENTICATED: 'auth.login.invalidCredentials' }),
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={styles.intro}>
        <h1 className={styles.title}>{t('auth.login.title')}</h1>
        <p className={styles.subtitle}>{t('auth.login.subtitle')}</p>
      </div>

      <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
        {sessionExpired && !submitErrorKey && (
          <Alert tone="info">{t('auth.login.sessionExpired')}</Alert>
        )}
        {submitErrorKey && <Alert tone="error">{t(submitErrorKey)}</Alert>}

        <TextField
          label={t('auth.email')}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={handleChange}
          error={errors.email && t(errors.email)}
          required
        />
        <TextField
          label={t('auth.password')}
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password && t(errors.password)}
          required
        />
        <Link to="/forgot-password" viewTransition className={styles.inlineLink}>
          {t('auth.login.forgotPassword')}
        </Link>

        <Button type="submit" fullWidth loading={submitting} className={styles.submit}>
          {t('auth.login.submit')}
        </Button>
      </form>

      <p className={styles.footer}>
        {t('auth.login.noAccount')}{' '}
        <Link to="/register" viewTransition>
          {t('auth.login.createAccount')}
        </Link>
      </p>
    </>
  );
}
