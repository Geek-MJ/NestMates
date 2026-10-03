import User from '../../models/User.js';
import { unauthenticated } from '../../utils/AppError.js';

/**
 * Returns the id of the household the user currently belongs to, or null.
 * Throws UNAUTHENTICATED when the account no longer exists.
 */
export async function getHouseholdIdOf(userId) {
  const user = await User.findById(userId).select('householdId').lean();
  if (!user) throw unauthenticated('USER_NOT_FOUND', 'The account no longer exists');
  return user.householdId ?? null;
}

/** True when the user is currently a member of the household (NFR-SEC-03). */
export async function isMemberOf(userId, householdId) {
  const currentHouseholdId = await getHouseholdIdOf(userId);
  return Boolean(currentHouseholdId) && String(currentHouseholdId) === String(householdId);
}
