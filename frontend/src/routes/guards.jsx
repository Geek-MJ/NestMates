import { Navigate, Outlet, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { getErrorMessageKey } from '../api/apiClient.js';
import Button from '../components/Button.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Spinner from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import styles from './guards.module.css';

export function homePathFor(user) {
  return user?.householdId ? '/expenses' : '/onboarding';
}

function SessionLoading() {
  const { t } = useTranslation();
  return (
    <div className={styles.fullPage}>
      <div className={styles.loading}>
        <Spinner size={28} label={t('session.restoring')} />
        <p aria-hidden="true">{t('session.restoring')}</p>
      </div>
    </div>
  );
}

function SessionError() {
  const { t } = useTranslation();
  const { sessionError, retrySession, logout } = useAuth();
  return (
    <div className={styles.fullPage}>
      <ErrorState
        title={t('session.errorTitle')}
        message={t(getErrorMessageKey(sessionError))}
        onRetry={retrySession}
        actions={
          <Button variant="ghost" onClick={logout}>
            {t('session.logout')}
          </Button>
        }
      />
    </div>
  );
}

/** Private routes: requires a valid session (SDD 3.2, AuthContext). */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <SessionLoading />;
  if (status === 'error') return <SessionError />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/** Login and registration pages: an authenticated user is sent back to the application. */
export function PublicOnly() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <SessionLoading />;
  if (status === 'authenticated') {
    const from = location.state?.from;
    return <Navigate to={from?.pathname ? from : homePathFor(user)} replace />;
  }
  return <Outlet />;
}

/** Household modules: a user without a household is sent to onboarding. */
export function RequireHousehold() {
  const { user } = useAuth();
  if (!user?.householdId) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

/** Onboarding: a user who already belongs to a household is sent to the landing page. */
export function RequireNoHousehold() {
  const { user } = useAuth();
  if (user?.householdId) return <Navigate to="/expenses" replace />;
  return <Outlet />;
}
