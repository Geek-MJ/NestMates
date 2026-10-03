/** The five household modules (SRS 6.1), in navigation order. */
export const MODULE_NAV_ITEMS = [
  { to: '/expenses', icon: 'expenses', labelKey: 'nav.expenses' },
  { to: '/calendar', icon: 'calendar', labelKey: 'nav.calendar' },
  { to: '/documents', icon: 'documents', labelKey: 'nav.documents' },
  { to: '/tasks', icon: 'tasks', labelKey: 'nav.tasks', shortLabelKey: 'nav.tasksShort' },
  { to: '/chat', icon: 'chat', labelKey: 'nav.chat' },
];

export const ONBOARDING_NAV_ITEM = { to: '/onboarding', icon: 'home', labelKey: 'nav.onboarding' };

export const ACCOUNT_NAV_ITEMS = [
  { to: '/household', icon: 'household', labelKey: 'nav.household' },
  { to: '/profile', icon: 'profile', labelKey: 'nav.profile' },
];
