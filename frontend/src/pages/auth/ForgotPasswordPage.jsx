import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import apiClient, { getErrorMessageKey } from '../../api/apiClient.js';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import TextField from '../../components/TextField.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { focusFirstInvalidField, validateEmail } from '../../utils/validation.js';
import cx from '../../utils/cx.js';
import styles from './AuthForm.module.css';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const formRef = useRef(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [submitErrorKey, setSubmitErrorKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  useDocumentTitle(t('auth.forgot.title'));

  async function handleSubmit(event) {
    event.preventDefault();
    const error = validateEmail(email);
    setEmailError(error);
    if (error) {
      focusFirstInvalidField(formRef.current);
      return;
    }

    setSubmitting(true);
    setSubmitErrorKey(null);
    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim() });
      setSentTo(email.trim());
    } catch (requestError) {
      setSubmitErrorKey(getErrorMessageKey(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <div role="status">
        <div className={styles.intro}>
          <span className={cx(styles.iconBadge, styles.iconBadgeSuccess)}>
            <Icon name="checkCircle" size={24} />
          </span>
          <h1 className={styles.title}>{t('auth.forgot.sentTitle')}</h1>
          <p className={styles.subtitle}>{t('auth.forgot.sentMessage', { email: sentTo })}</p>
        </div>
        <Button as={Link} to="/login" viewTransition variant="secondary" fullWidth>
          {t('auth.forgot.backToLogin')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.intro}>
        <span className={styles.iconBadge}>
          <Icon name="key" size={24} />
        </span>
        <h1 className={styles.title}>{t('auth.forgot.title')}</h1>
        <p className={styles.subtitle}>{t('auth.forgot.subtitle')}</p>
      </div>

      <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
        {submitErrorKey && <Alert tone="error">{t(submitErrorKey)}</Alert>}

        <TextField
          label={t('auth.email')}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(null);
          }}
          error={emailError && t(emailError)}
          required
        />

        <Button type="submit" fullWidth loading={submitting} className={styles.submit}>
          {t('auth.forgot.submit')}
        </Button>
      </form>

      <p className={styles.footer}>
        <Link to="/login" viewTransition>
          {t('auth.forgot.backToLogin')}
        </Link>
      </p>
    </>
  );
}
