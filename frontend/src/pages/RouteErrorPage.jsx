import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button.jsx';
import ErrorState from '../components/ErrorState.jsx';
import styles from './StandalonePage.module.css';

/** Last-resort screen when rendering a route throws. */
export default function RouteErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className={styles.page}>
      <ErrorState
        title={t('routeError.title')}
        message={t('routeError.message')}
        actions={
          <Button icon="refresh" onClick={() => window.location.reload()}>
            {t('common.reload')}
          </Button>
        }
      />
    </main>
  );
}
