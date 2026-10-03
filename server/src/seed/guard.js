/**
 * The development seed may run only when both the process and the database
 * name clearly say development. Production and anything else are refused.
 */
export function databaseNameFromUri(uri) {
  if (typeof uri !== 'string' || !uri.trim()) return '';
  const withoutQuery = uri.trim().split('?')[0];
  const slash = withoutQuery.lastIndexOf('/');
  if (slash < 0 || slash === withoutQuery.length - 1) return '';
  return decodeURIComponent(withoutQuery.slice(slash + 1));
}

export function assertDevelopmentSeed(env = process.env) {
  if (env.NODE_ENV !== 'development') {
    throw new Error('Refusing to seed: NODE_ENV must be development. This command never runs in production.');
  }
  const name = databaseNameFromUri(env.MONGODB_URI);
  if (!name || /prod/i.test(name) || !/dev/i.test(name)) {
    throw new Error(
      `Refusing to seed: the database name "${name || '(missing)'}" is not a development database.`,
    );
  }
  return name;
}
