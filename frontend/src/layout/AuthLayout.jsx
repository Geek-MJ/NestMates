import { Link, Outlet, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import LanguageSwitch from '../components/LanguageSwitch.jsx';
import { setVisitorLanguage } from '../i18n/index.js';
import HomeScene from '../landing/world/HomeScene.jsx';
import { C } from '../landing/world/palette.js';
import WorldDefs from '../landing/world/WorldDefs.jsx';
import Brand from './Brand.jsx';
import styles from './AuthLayout.module.css';

/** Each page opens the illustrated front door a little differently. */
const DOORWAYS = {
  '/login': { scene: 'login', door: 0.55 },
  '/register': { scene: 'register', door: 0.8 },
  '/forgot-password': { scene: 'forgot', door: 0.18 },
  '/reset-password': { scene: 'reset', door: 0.35 },
};

const DOORWAY_VIEW = '556 512 488 448';
const BANNER_VIEW = '160 600 1280 340';

function DoorLight() {
  return <ellipse className={styles.doorLight} cx="800" cy="938" rx="150" ry="16" fill={C.light} />;
}

/** Layout of the authentication pages, with the FR / EN switch available before login. */
export default function AuthLayout() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const doorway = DOORWAYS[pathname] ?? DOORWAYS['/login'];

  return (
    <div className={styles.page} style={{ '--door': doorway.door }}>
      <a href="#main" className="skip-link">
        {t('a11y.skipToContent')}
      </a>
      <WorldDefs />

      <aside className={styles.panel}>
        <Link to="/" className={styles.brandLink}>
          <Brand />
        </Link>
        <div className={styles.doorway} aria-hidden="true">
          <HomeScene facade view={DOORWAY_VIEW} className={styles.doorwayScene} preserveAspectRatio="xMidYMax meet">
            <DoorLight />
          </HomeScene>
        </div>
        <div key={doorway.scene} className={styles.panelText}>
          <p className={styles.tagline}>{t(`authScene.${doorway.scene}.title`)}</p>
          <p className={styles.pitch}>{t(`authScene.${doorway.scene}.body`)}</p>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.header}>
          <Link to="/" className={styles.headerBrand}>
            <Brand />
          </Link>
          <LanguageSwitch value={i18n.resolvedLanguage} onChange={setVisitorLanguage} />
        </header>

        <div className={styles.banner} aria-hidden="true">
          <HomeScene facade view={BANNER_VIEW} className={styles.bannerScene} preserveAspectRatio="xMidYMid slice">
            <DoorLight />
          </HomeScene>
        </div>

        <main id="main" tabIndex={-1} className={styles.main}>
          <div className={styles.card}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
