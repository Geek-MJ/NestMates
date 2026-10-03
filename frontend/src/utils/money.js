const MAX_AMOUNT_CENTS = 100_000_000;

/** Converts a euro entry such as "12.50" or "12,5" into integer cents. Returns null when invalid. */
export function parseAmountToCents(raw) {
  if (typeof raw !== 'string') return null;
  const value = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_AMOUNT_CENTS) return null;
  return cents;
}
