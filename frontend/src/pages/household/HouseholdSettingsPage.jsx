import { useCallback, useEffect, useId, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import apiClient, { getErrorMessageKey } from '../../api/apiClient.js';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import Modal from '../../components/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Spinner from '../../components/Spinner.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { personName } from '../../utils/fields.js';
import { formatAmount } from '../../utils/format.js';
import styles from './HouseholdSettingsPage.module.css';

function useHousehold(householdId) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ status: 'loading', household: null, error: null });

  const retry = useCallback(() => {
    setResult({ status: 'loading', household: null, error: null });
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    apiClient
      .get(`/households/${householdId}`, { signal: controller.signal })
      .then(({ data }) => {
        if (active) setResult({ status: 'ready', household: data, error: null });
      })
      .catch((error) => {
        if (active) setResult({ status: 'error', household: null, error });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [householdId, attempt]);

  return { ...result, retry };
}

function CopyCode({ code }) {
  const { t } = useTranslation();
  const statusId = useId();
  const [copyState, setCopyState] = useState('idle');

  async function handleCopy() {
    setCopyState('idle');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  return (
    <div className={styles.copyBlock}>
      <div className={styles.codeRow}>
        <p className={styles.code} translate="no">
          {code}
        </p>
        <Button type="button" variant="secondary" onClick={handleCopy} aria-describedby={statusId}>
          {t('householdSettings.invitation.copy')}
        </Button>
      </div>
      <p id={statusId} role="status" className={styles.copyStatus} data-copy-state={copyState}>
        {copyState === 'copied' ? t('householdSettings.invitation.copied') : ''}
      </p>
      {copyState === 'failed' && (
        <Alert tone="error">{t('householdSettings.invitation.copyFailed')}</Alert>
      )}
    </div>
  );
}

function NoHousehold() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon="household"
      title={t('householdSettings.empty.title')}
      description={t('householdSettings.empty.description')}
      action={
        <>
          <Button as={Link} to="/onboarding#create-household">
            {t('onboarding.create.title')}
          </Button>
          <Button as={Link} to="/onboarding#join-household" variant="secondary">
            {t('onboarding.join.title')}
          </Button>
        </>
      }
    />
  );
}

function HouseholdDetails({ householdId }) {
  const { t, i18n } = useTranslation();
  const { user, applyUser } = useAuth();
  const { status, household, error, retry } = useHousehold(householdId);
  const [checkingLeave, setCheckingLeave] = useState(false);
  const [blockingDebts, setBlockingDebts] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState(null);

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <Spinner size={28} label={t('householdSettings.loading')} />
        <p aria-hidden="true">{t('householdSettings.loading')}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <ErrorState
        title={t('householdSettings.errorTitle')}
        message={t(getErrorMessageKey(error))}
        onRetry={retry}
      />
    );
  }

  const members = household.members ?? [];

  async function startLeave() {
    setCheckingLeave(true);
    setLeaveError(null);
    setBlockingDebts(null);
    try {
      const { data } = await apiClient.get(`/households/${householdId}/debts`);
      const openDebts = (data.debts ?? []).filter(
        (debt) => debt.from.id === user.id || debt.to.id === user.id,
      );
      if (openDebts.length > 0) setBlockingDebts(openDebts);
      else setConfirmLeave(true);
    } catch (leaveCheckError) {
      setLeaveError(leaveCheckError);
    } finally {
      setCheckingLeave(false);
    }
  }

  async function confirmLeaveHousehold() {
    setLeaving(true);
    setLeaveError(null);
    try {
      await apiClient.post(`/households/${householdId}/leave`);
      applyUser({ ...user, householdId: null });
    } catch (leaveRequestError) {
      setLeaveError(leaveRequestError);
      setConfirmLeave(false);
      if (leaveRequestError?.details?.reason === 'DEBTS_NOT_SETTLED') {
        setBlockingDebts(leaveRequestError.details.debts ?? []);
      }
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div className={styles.stack}>
      <section className={styles.card} aria-labelledby="household-name-label">
        <h2 id="household-name-label" className={styles.kicker}>
          {t('householdSettings.nameLabel')}
        </h2>
        <p className={styles.householdName}>{household.name}</p>
      </section>

      <section className={styles.card} aria-labelledby="invitation-label">
        <h2 id="invitation-label" className={styles.sectionTitle}>
          {t('householdSettings.invitation.label')}
        </h2>
        <CopyCode code={household.invitationCode} />
        <p className={styles.hint}>{t('householdSettings.invitation.hint')}</p>
      </section>

      <section className={styles.card} aria-labelledby="members-label">
        <h2 id="members-label" className={styles.sectionTitle}>
          {t('householdSettings.members.title')}
        </h2>
        {members.length === 0 ? (
          <p className={styles.hint}>{t('householdSettings.members.empty')}</p>
        ) : (
          <ul className={styles.memberList}>
            {members.map((member) => (
              <li key={member.id} className={styles.member}>
                <span className={styles.memberName}>{member.name}</span>
                {member.id === user.id && (
                  <span className={styles.you}>{t('householdSettings.members.you')}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.card} aria-labelledby="leave-label">
        <h2 id="leave-label" className={styles.sectionTitle}>
          {t('householdSettings.leave.title')}
        </h2>
        <p className={styles.hint}>{t('householdSettings.leave.hint')}</p>
        {leaveError && <Alert tone="error">{t(getErrorMessageKey(leaveError))}</Alert>}
        {blockingDebts && (
          <>
            <p className={styles.hint}>{t('householdSettings.leave.blocked')}</p>
            <ul className={styles.memberList}>
              {blockingDebts.map((debt) => (
                <li key={`${debt.from.id}-${debt.to.id}`} className={styles.member}>
                  <span className={styles.memberName}>
                    {t('householdSettings.leave.debt', {
                      from: personName(debt.from, t),
                      to: personName(debt.to, t),
                      amount: formatAmount(debt.amountCents, i18n.language),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        <Button type="button" variant="danger" onClick={startLeave} loading={checkingLeave} disabled={checkingLeave}>
          {t('householdSettings.leave.action')}
        </Button>
      </section>

      <Modal
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title={t('householdSettings.leave.confirmTitle')}
        description={t('householdSettings.leave.confirmBody')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmLeave(false)} disabled={leaving}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={confirmLeaveHousehold} loading={leaving} disabled={leaving}>
              {t('householdSettings.leave.action')}
            </Button>
          </>
        }
      />
    </div>
  );
}

export default function HouseholdSettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  useDocumentTitle(t('pages.household.title'));

  return (
    <>
      <PageHeader title={t('pages.household.title')} description={t('pages.household.description')} motif="household" />
      {user?.householdId ? (
        <HouseholdDetails key={user.householdId} householdId={user.householdId} />
      ) : (
        <NoHousehold />
      )}
    </>
  );
}
