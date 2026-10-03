import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import styles from './StandalonePage.module.css';

export default function NotFoundPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.title'));

  return (
    <main id="main" className={styles.page}>
      <EmptyState
        icon="home"
        title={t('notFound.title')}
        description={t('notFound.message')}
        action={
          <Button as={Link} to="/">
            {t('common.backToHome')}
          </Button>
        }
      />
    </main>
  );
}
