export const LANGUAGES = ['fr', 'en'];

/**
 * FR-ACC-16: the default language is the browser language, French if it starts with "fr",
 * English otherwise. The browser's primary language is the first Accept-Language entry.
 */
export function languageFromAcceptLanguage(header) {
  const primary = typeof header === 'string' ? header.split(',')[0].trim().toLowerCase() : '';
  return primary.startsWith('fr') ? 'fr' : 'en';
}
