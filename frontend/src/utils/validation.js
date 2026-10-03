// Client-side checks mirror the SRS rules for immediate feedback; the API remains the authority.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITATION_CODE_PATTERN = /^[A-Z0-9]{8}$/;

export const PASSWORD_MIN_LENGTH = 8;
export const INVITATION_CODE_LENGTH = 8;

export function validateRequired(value) {
  return String(value ?? '').trim() ? null : 'validation.required';
}

export function validateEmail(value) {
  const email = String(value ?? '').trim();
  if (!email) return 'validation.required';
  return EMAIL_PATTERN.test(email) ? null : 'validation.email';
}

/** FR-ACC-01: at least 8 characters, including a letter and a digit. */
export function validatePassword(value) {
  const password = String(value ?? '');
  if (!password) return 'validation.required';
  const isValid =
    password.length >= PASSWORD_MIN_LENGTH && /\p{L}/u.test(password) && /\d/.test(password);
  return isValid ? null : 'validation.passwordRules';
}

export function normalizeInvitationCode(value) {
  return String(value ?? '')
    .replace(/[\s-]/g, '')
    .toUpperCase();
}

export function validateInvitationCode(value) {
  const code = normalizeInvitationCode(value);
  if (!code) return 'validation.required';
  return INVITATION_CODE_PATTERN.test(code) ? null : 'validation.invitationCode';
}

export function hasErrors(errors) {
  return Object.values(errors).some(Boolean);
}

export function focusFirstInvalidField(form) {
  requestAnimationFrame(() => {
    form?.querySelector('[aria-invalid="true"]')?.focus();
  });
}
