import i18n from '../i18n/index.js';

/** Translates the first server field error for `field`, when the response has one. */
export function fieldMessage(t, error, field) {
  const code = error?.details?.fields?.find((item) => item.field === field)?.code;
  if (!code) return undefined;
  const key = `validation.codes.${code}`;
  return t(i18n.exists(key) ? key : 'validation.required');
}

export function personName(person, t) {
  return person?.name || t('common.formerMember');
}
