import bcrypt from 'bcrypt';

// SDD 6.1: bcrypt with a cost factor of 12.
const COST_FACTOR = 12;

let timingReferenceHash;

export function hashPassword(password) {
  return bcrypt.hash(password, COST_FACTOR);
}

export function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

/**
 * Runs a comparison of the same cost when no account matches, so that response times do not
 * reveal which email addresses are registered.
 */
export async function verifyAgainstNoAccount(password) {
  timingReferenceHash ??= bcrypt.hash('nestmates-no-account', COST_FACTOR);
  await bcrypt.compare(password, await timingReferenceHash);
  return false;
}
