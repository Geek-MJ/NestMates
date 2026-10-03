import { useTranslation } from 'react-i18next';
import { getErrorMessageKey } from '../api/apiClient.js';
import ErrorState from './ErrorState.jsx';
import Spinner from './Spinner.jsx';
import styles from '../pages/module.module.css';

/** Shared loading and error presentation for a module that reads the API. */
export default function ResourceState({ status, error, onRetry, loadingLabel, errorTitle, children }) {
  const { t } = useTranslation();

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <Spinner size={28} label={loadingLabel} />
        <p aria-hidden="true">{loadingLabel}</p>
      </div>
    );
  }

  if (status === 'error') {
    return <ErrorState title={errorTitle} message={t(getErrorMessageKey(error))} onRetry={onRetry} />;
  }

  return children;
}
