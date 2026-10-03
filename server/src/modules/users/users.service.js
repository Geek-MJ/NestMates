import User, { toPublicUser } from '../../models/User.js';
import { hashPassword, verifyPassword } from '../../services/passwordService.js';
import AppError, { conflict, unauthenticated } from '../../utils/AppError.js';

function missingAccount() {
  return unauthenticated('USER_NOT_FOUND', 'The account no longer exists');
}

function isDuplicateEmailError(error) {
  return error?.code === 11000 && Boolean(error.keyPattern?.email);
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw missingAccount();
  return toPublicUser(user);
}

/** FR-ACC-13 / FR-ACC-15: updates the real user and returns the safe representation. */
export async function updateCurrentUser(userId, update) {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { returnDocument: 'after', runValidators: true },
    ).lean();
    if (!user) throw missingAccount();
    return toPublicUser(user);
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw conflict('EMAIL_TAKEN', 'An account already uses this email address');
    }
    throw error;
  }
}

/**
 * FR-ACC-14: replaces the password after checking the current one. The JWT stays valid;
 * the API is stateless (SDD 5).
 */
export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw missingAccount();

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError(400, 'VALIDATION_ERROR', 'The current password is incorrect', {
      reason: 'CURRENT_PASSWORD_INCORRECT',
    });
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
}

/**
 * FR-ACC-12: a user who belongs to a household cannot delete their account.
 * Leaving still depends on settled debts (FR-ACC-10), which are not available yet.
 */
export async function deleteCurrentUser(userId) {
  const { deletedCount } = await User.deleteOne({ _id: userId, householdId: null });
  if (deletedCount === 1) return;

  const user = await User.findById(userId).select('householdId').lean();
  if (!user) throw missingAccount();
  throw conflict(
    'ACCOUNT_IN_HOUSEHOLD',
    'Leave your household before deleting your account',
  );
}
