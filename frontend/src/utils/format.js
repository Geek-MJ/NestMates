const LOCALES = {
  fr: 'fr-FR',
  en: 'en-GB',
};

function localeFor(language) {
  return LOCALES[language] ?? LOCALES.en;
}

/** Formats an amount stored in cents as euros, e.g. "1 234,50 €" (fr) or "€1,234.50" (en). */
export function formatAmount(amountCents, language) {
  return new Intl.NumberFormat(localeFor(language), {
    style: 'currency',
    currency: 'EUR',
  }).format(amountCents / 100);
}

export function formatDate(value, language, options = { dateStyle: 'medium' }) {
  return new Intl.DateTimeFormat(localeFor(language), options).format(new Date(value));
}

/** A calendar date stored as YYYY-MM-DD, formatted without a timezone shift. */
export function formatDateOnly(value, language) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Intl.DateTimeFormat(localeFor(language), { dateStyle: 'medium' }).format(
    new Date(year, month - 1, day),
  );
}

export function formatFileSize(bytes, language) {
  const locale = localeFor(language);
  if (bytes < 1024 * 1024) {
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'kilobyte',
      unitDisplay: 'short',
      maximumFractionDigits: 0,
    }).format(bytes / 1024);
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'megabyte',
    unitDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(bytes / (1024 * 1024));
}

export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}
