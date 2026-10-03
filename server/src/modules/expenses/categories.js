/**
 * The SRS requires a category but does not list the values.
 * This is the closed set used by the API and the interface.
 */
export const EXPENSE_CATEGORIES = Object.freeze([
  'rent',
  'groceries',
  'bills',
  'household',
  'transport',
  'leisure',
  'other',
]);

export const DESCRIPTION_MAX_LENGTH = 500;
export const MAX_AMOUNT_CENTS = 100_000_000;
