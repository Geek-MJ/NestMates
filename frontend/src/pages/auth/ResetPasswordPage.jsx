import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import apiClient, { getErrorMessageKey } from '../../api/apiClient.js';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import TextField from '../../components/TextField.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import cx from '../../utils/cx.js';
import { focusFirstInvalidField, validatePassword } from '../../utils/validation.js';
import styles from './AuthForm.module.css';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const formRef = useRef(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [submitErrorKey, setSubmitErrorKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useDocumentTitle(t('auth.reset.title'));

  async function handleSubmit(event) {
    event.preventDefault();
    const error = validatePassword(password);
    setPasswordError(error);
    if (error) {
      focusFirstInvalidField(formRef.current);
      return;
    }

    setSubmitting(true);
    setSubmitErrorKey(null);
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (requestError) {
      setSubmitErrorKey(getErrorMessageKey(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <>
        <div className={styles.intro}>
          <span className={styles.iconBadge}>
            <Icon name="alert" size={24} />
          </span>
          <h1 className={styles.title}>{t('auth.reset.missingTokenTitle')}</h1>
          <p className={styles.subtitle}>{t('auth.reset.missingTokenMessage')}</p>
        </div>
        <Button as={Link} to="/forgot-password" viewTransition fullWidth>
          {t('auth.reset.requestNewLink')}
        </Button>
      </>
    );
  }

  if (done) {
    return (
      <div role="status">
        <div className={styles.intro}>
          <span className={cx(styles.iconBadge, styles.iconBadgeSuccess)}>
            <Icon name="checkCircle" size={24} />
          </span>
          <h1 className={styles.title}>{t('auth.reset.successTitle')}</h1>
          <p className={styles.subtitle}>{t('auth.reset.successMessage')}</p>
        </div>
        <Button as={Link} to="/login" viewTransition fullWidth>
          {t('auth.reset.goToLogin')}
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
        <h1 className={styles.title}>{t('auth.reset.title')}</h1>
        <p className={styles.subtitle}>{t('auth.reset.subtitle')}</p>
      </div>

      <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
        {submitErrorKey && <Alert tone="error">{t(submitErrorKey)}</Alert>}

        <TextField
          label={t('auth.reset.newPassword')}
          name="password"
          type="password"
          autoComplete="new-password"
          hint={t('auth.register.passwordHint')}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setPasswordError(null);
          }}
          error={passwordError && t(passwordError)}
          required
        />

        <Button type="submit" fullWidth loading={submitting} className={styles.submit}>
          {t('auth.reset.submit')}
        </Button>
      </form>
    </>
  );
}
