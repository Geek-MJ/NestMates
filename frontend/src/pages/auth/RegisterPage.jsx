import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { getErrorMessageKey } from '../../api/apiClient.js';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import Checkbox from '../../components/Checkbox.jsx';
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
import styles from './AuthForm.module.css';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const formRef = useRef(null);
  const [values, setValues] = useState({ name: '', email: '', password: '', acceptPrivacy: false });
  const [errors, setErrors] = useState({});
  const [submitErrorKey, setSubmitErrorKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useDocumentTitle(t('auth.register.title'));

  function handleChange(event) {
    const { name, type, checked, value } = event.target;
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: null }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {
      name: validateRequired(values.name),
      email: validateEmail(values.email),
      password: validatePassword(values.password),
      acceptPrivacy: values.acceptPrivacy ? null : 'validation.privacyRequired',
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      focusFirstInvalidField(formRef.current);
      return;
    }

    setSubmitting(true);
    setSubmitErrorKey(null);
    try {
      // On success the PublicOnly guard redirects to onboarding.
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        acceptPrivacy: values.acceptPrivacy,
      });
    } catch (error) {
      setSubmitErrorKey(getErrorMessageKey(error, { CONFLICT: 'auth.register.emailTaken' }));
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className={styles.intro}>
        <h1 className={styles.title}>{t('auth.register.title')}</h1>
        <p className={styles.subtitle}>{t('auth.register.subtitle')}</p>
      </div>

      <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
        {submitErrorKey && <Alert tone="error">{t(submitErrorKey)}</Alert>}

        <TextField
          label={t('auth.register.name')}
          name="name"
          autoComplete="name"
          value={values.name}
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
          value={values.email}
          onChange={handleChange}
          error={errors.email && t(errors.email)}
          required
        />
        <TextField
          label={t('auth.password')}
          name="password"
          type="password"
          autoComplete="new-password"
          hint={t('auth.register.passwordHint')}
          value={values.password}
          onChange={handleChange}
          error={errors.password && t(errors.password)}
          required
        />
        <Checkbox
          label={t('auth.register.acceptPrivacy')}
          name="acceptPrivacy"
          checked={values.acceptPrivacy}
          onChange={handleChange}
          error={errors.acceptPrivacy && t(errors.acceptPrivacy)}
          required
        />
        <p className={styles.consentNote}>
          {t('auth.register.googleTermsLead')}{' '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
            {t('auth.register.googleTermsLink')}
            <span className="visually-hidden"> ({t('a11y.opensNewTab')})</span>
          </a>
        </p>

        <Button type="submit" fullWidth loading={submitting} className={styles.submit}>
          {t('auth.register.submit')}
        </Button>
      </form>

      <p className={styles.footer}>
        {t('auth.register.haveAccount')}{' '}
        <Link to="/login" viewTransition>
          {t('auth.register.login')}
        </Link>
      </p>
    </>
  );
}
