import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Brand from '../../layout/Brand.jsx';
import styles from './LandingFooter.module.css';

export default function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.about}>
          <Brand />
          <p>{t('landing.footer.tagline')}</p>
        </div>
        <nav aria-label={t('landing.footer.label')}>
          <ul className={styles.links}>
            <li>
              <Link to="/login">{t('landing.footer.login')}</Link>
            </li>
            <li>
              <Link to="/register">{t('landing.footer.register')}</Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
