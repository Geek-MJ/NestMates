import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import apiClient, { getErrorMessageKey } from '../../api/apiClient.js';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import TextField from '../../components/TextField.jsx';
import TiltCard from '../../components/TiltCard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import HomeScene from '../../landing/world/HomeScene.jsx';
import WorldDefs from '../../landing/world/WorldDefs.jsx';
import {
  INVITATION_CODE_LENGTH,
  focusFirstInvalidField,
  normalizeInvitationCode,
  validateInvitationCode,
  validateRequired,
} from '../../utils/validation.js';
import styles from './OnboardingPage.module.css';

const HERO_VIEW = '120 40 1360 920';

function useHouseholdAction(request, errorOverrides) {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState(null);

  async function run(payload) {
    setSubmitting(true);
    setErrorKey(null);
    try {
      await request(payload);
      await refreshUser();
      navigate('/expenses', { replace: true });
    } catch (error) {
      setErrorKey(getErrorMessageKey(error, errorOverrides));
      setSubmitting(false);
    }
  }

  return { run, submitting, errorKey };
}

function CreateHouseholdForm() {
  const { t } = useTranslation();
  const formRef = useRef(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(null);
  const { run, submitting, errorKey } = useHouseholdAction(
    (payload) => apiClient.post('/households', payload),
    { CONFLICT: 'onboarding.create.alreadyMember' },
  );

  function handleSubmit(event) {
    event.preventDefault();
    const error = validateRequired(name);
    setNameError(error);
    if (error) {
      focusFirstInvalidField(formRef.current);
      return;
    }
    run({ name: name.trim() });
  }

  return (
    <TiltCard as="section" id="create-household" className={styles.card} aria-labelledby="create-household-title">
      <span className={styles.iconBadge}>
        <Icon name="home" size={22} />
      </span>
      <div className={styles.cardIntro}>
        <h2 id="create-household-title" className={styles.cardTitle}>
          {t('onboarding.create.title')}
        </h2>
        <p className={styles.cardDescription}>{t('onboarding.create.description')}</p>
      </div>
      <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
        {errorKey && <Alert tone="error">{t(errorKey)}</Alert>}
        <TextField
          label={t('onboarding.create.name')}
          name="name"
          autoComplete="off"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setNameError(null);
          }}
          error={nameError && t(nameError)}
          required
        />
        <Button type="submit" loading={submitting} className={styles.submit}>
          {t('onboarding.create.submit')}
        </Button>
      </form>
    </TiltCard>
  );
}

function JoinHouseholdForm() {
  const { t } = useTranslation();
  const formRef = useRef(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(null);
  const { run, submitting, errorKey } = useHouseholdAction(
    (payload) => apiClient.post('/households/join', payload),
    {
      NOT_FOUND: 'onboarding.join.invalidCode',
      CONFLICT: 'onboarding.join.alreadyMember',
    },
  );

  function handleSubmit(event) {
    event.preventDefault();
    const error = validateInvitationCode(code);
    setCodeError(error);
    if (error) {
      focusFirstInvalidField(formRef.current);
      return;
    }
    run({ invitationCode: normalizeInvitationCode(code) });
  }

  return (
    <TiltCard as="section" id="join-household" className={styles.card} aria-labelledby="join-household-title">
      <span className={styles.iconBadge}>
        <Icon name="household" size={22} />
      </span>
      <div className={styles.cardIntro}>
        <h2 id="join-household-title" className={styles.cardTitle}>
          {t('onboarding.join.title')}
        </h2>
        <p className={styles.cardDescription}>{t('onboarding.join.description')}</p>
      </div>
      <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
        {errorKey && <Alert tone="error">{t(errorKey)}</Alert>}
        <TextField
          label={t('onboarding.join.code')}
          name="invitationCode"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={INVITATION_CODE_LENGTH + 2}
          className={styles.codeField}
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase());
            setCodeError(null);
          }}
          error={codeError && t(codeError)}
          required
        />
        <Button type="submit" variant="secondary" loading={submitting} className={styles.submit}>
          {t('onboarding.join.submit')}
        </Button>
      </form>
    </TiltCard>
  );
}

export default function OnboardingPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('onboarding.title'));

  return (
    <>
      <WorldDefs />
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>{t('onboardingHero.eyebrow')}</p>
          <h1 className={styles.title}>{t('onboarding.title')}</h1>
          <p className={styles.subtitle}>{t('onboarding.subtitle')}</p>
        </div>
        <div className={styles.heroScene} aria-hidden="true">
          <HomeScene facade view={HERO_VIEW} className={styles.heroSvg} preserveAspectRatio="xMidYMax slice" />
        </div>
      </header>
      <div className={styles.grid}>
        <CreateHouseholdForm />
        <span className={styles.or} aria-hidden="true">
          {t('onboardingHero.or')}
        </span>
        <JoinHouseholdForm />
      </div>
    </>
  );
}
