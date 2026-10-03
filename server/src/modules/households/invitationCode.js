import { randomInt } from 'node:crypto';

// SDD 6.1: 8 characters, uppercase letters and digits, without ambiguous characters (O/0, I/1).
export const INVITATION_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const INVITATION_CODE_LENGTH = 8;
export const INVITATION_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;

export function generateInvitationCode() {
  let code = '';
  for (let index = 0; index < INVITATION_CODE_LENGTH; index += 1) {
    code += INVITATION_CODE_ALPHABET[randomInt(INVITATION_CODE_ALPHABET.length)];
  }
  return code;
}

/** Accepts codes typed in lowercase or with spaces / dashes, as the frontend does. */
export function normalizeInvitationCode(value) {
  return value.replace(/[\s-]/g, '').toUpperCase();
}
