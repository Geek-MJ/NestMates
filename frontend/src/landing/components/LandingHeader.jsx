import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import InteractiveButton from '../../components/InteractiveButton.jsx';
import LanguageSwitch from '../../components/LanguageSwitch.jsx';
import { setVisitorLanguage } from '../../i18n/index.js';
import Brand from '../../layout/Brand.jsx';
import styles from './LandingHeader.module.css';

const isScrolled = () => window.scrollY > 8;

export default function LandingHeader() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(isScrolled);

  useEffect(() => {
    const onScroll = () => setScrolled(isScrolled());
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={styles.header} data-scrolled={scrolled}>
      <Link to="/" className={styles.brand}>
        <Brand />
      </Link>
      <nav className={styles.actions} aria-label={t('landing.header.label')}>
        <LanguageSwitch value={i18n.resolvedLanguage} onChange={setVisitorLanguage} />
        <Link to="/login" className={styles.login}>
          {t('landing.header.login')}
        </Link>
        <InteractiveButton to="/register" size="md" className={styles.getStarted}>
          {t('landing.header.getStarted')}
        </InteractiveButton>
      </nav>
    </header>
  );
}
