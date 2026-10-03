import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import cx from '../utils/cx.js';
import { getInitials } from '../utils/format.js';
import Brand from './Brand.jsx';
import { ACCOUNT_NAV_ITEMS, MODULE_NAV_ITEMS, ONBOARDING_NAV_ITEM } from './navItems.js';
import styles from './AppLayout.module.css';

function navLinkClass({ isActive }) {
  return cx(styles.navLink, isActive && styles.navLinkActive);
}

/**
 * Authenticated layout: sidebar on desktop, compact rail on tablet,
 * top bar and bottom navigation on mobile (SDD 3.2).
 */
export default function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const isFirstRender = useRef(true);

  const hasHousehold = Boolean(user?.householdId);
  const primaryItems = hasHousehold ? MODULE_NAV_ITEMS : [ONBOARDING_NAV_ITEM];
  const accountItems = ACCOUNT_NAV_ITEMS.filter((item) => hasHousehold || !item.requiresHousehold);

  // Move focus to the new page so keyboard and screen reader users start from its content.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <a href="#main" className="skip-link">
        {t('a11y.skipToContent')}
      </a>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <Brand className={styles.brandFull} />
          <Brand compact className={styles.brandCompact} />
        </div>

        <nav aria-label={t('nav.primary')} className={styles.sidebarSection}>
          <ul className={styles.navList}>
            {primaryItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} viewTransition className={navLinkClass}>
                  <Icon name={item.icon} size={20} className={styles.navIcon} />
                  <span className={styles.navLabel}>{t(item.labelKey)}</span>
                  <span className={styles.navLabelShort}>{t(item.shortLabelKey ?? item.labelKey)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.sidebarFooter}>
          <nav aria-label={t('nav.account')}>
            <ul className={styles.navList}>
              {accountItems.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} viewTransition className={navLinkClass}>
                    <Icon name={item.icon} size={20} className={styles.navIcon} />
                    <span className={styles.navLabel}>{t(item.labelKey)}</span>
                    <span className={styles.navLabelShort}>{t(item.labelKey)}</span>
                  </NavLink>
                </li>
              ))}
              <li>
                <button type="button" className={styles.navLink} onClick={logout}>
                  <Icon name="logout" size={20} className={styles.navIcon} />
                  <span className={styles.navLabel}>{t('nav.logout')}</span>
                  <span className={styles.navLabelShort}>{t('nav.logout')}</span>
                </button>
              </li>
            </ul>
          </nav>

          {user && (
            <div className={styles.userCard}>
              <span className={styles.avatar} aria-hidden="true">
                {getInitials(user.name)}
              </span>
              <span className={styles.userText}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userEmail}>{user.email}</span>
              </span>
            </div>
          )}
        </div>
      </aside>

      <header className={styles.topbar}>
        <Brand />
        <div className={styles.topbarActions}>
          {accountItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              viewTransition
              aria-label={t(item.labelKey)}
              title={t(item.labelKey)}
              className={({ isActive }) => cx(styles.iconButton, isActive && styles.iconButtonActive)}
            >
              <Icon name={item.icon} size={20} />
            </NavLink>
          ))}
          <button
            type="button"
            className={styles.iconButton}
            onClick={logout}
            aria-label={t('nav.logout')}
            title={t('nav.logout')}
          >
            <Icon name="logout" size={20} />
          </button>
        </div>
      </header>

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className={cx(styles.main, hasHousehold && styles.mainWithBottomNav)}
      >
        <div className={styles.page}>
          <Outlet />
        </div>
      </main>

      {hasHousehold && (
        <nav aria-label={t('nav.primary')} className={styles.bottomNav}>
          <ul className={styles.bottomNavList}>
            {MODULE_NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  viewTransition
                  className={({ isActive }) =>
                    cx(styles.bottomNavLink, isActive && styles.bottomNavLinkActive)
                  }
                >
                  <Icon name={item.icon} size={22} className={styles.bottomNavIcon} />
                  <span>{t(item.shortLabelKey ?? item.labelKey)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
