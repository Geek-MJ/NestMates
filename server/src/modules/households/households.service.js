import Household, { toPublicHousehold } from '../../models/Household.js';
import User from '../../models/User.js';
import { getDebtsInvolving } from '../expenses/debtService.js';
import AppError, { conflict, notFound } from '../../utils/AppError.js';
import { runAtomically } from '../../utils/transaction.js';
import { disconnectUser } from '../../realtime/presence.js';
import { deleteHouseholdData } from './householdDeletion.js';
import { generateInvitationCode } from './invitationCode.js';
import { getHouseholdIdOf } from './membership.js';

const MAX_CODE_ATTEMPTS = 5;

function alreadyInHousehold() {
  return conflict(
    'ALREADY_IN_HOUSEHOLD',
    'You already belong to a household. Leave it before creating or joining another one.',
  );
}

/**
 * Sets the user's household only if they still have none, so concurrent requests can never
 * give a user two memberships.
 */
async function assignHousehold(userId, householdId) {
  const { matchedCount } = await User.updateOne(
    { _id: userId, householdId: null },
    { $set: { householdId } },
  );
  return matchedCount === 1;
}

async function insertHouseholdWithUniqueCode(name) {
  for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt += 1) {
    try {
      return await Household.create({ name, invitationCode: generateInvitationCode() });
    } catch (error) {
      if (!(error?.code === 11000 && error.keyPattern?.invitationCode)) throw error;
    }
  }
  throw new AppError(500, 'INTERNAL_ERROR', 'Could not generate a unique invitation code');
}

/** FR-ACC-05 / FR-ACC-06: the creator becomes the first member. */
export async function createHousehold(userId, { name }) {
  if (await getHouseholdIdOf(userId)) throw alreadyInHousehold();

  const household = await insertHouseholdWithUniqueCode(name);
  if (!(await assignHousehold(userId, household._id))) {
    await Household.deleteOne({ _id: household._id });
    throw alreadyInHousehold();
  }
  return toPublicHousehold(household);
}

/** FR-ACC-08: a user without a household joins with a valid invitation code. */
export async function joinHousehold(userId, { invitationCode }) {
  if (await getHouseholdIdOf(userId)) throw alreadyInHousehold();

  const household = await Household.findOne({ invitationCode }).lean();
  if (!household) {
    throw notFound('INVALID_INVITATION_CODE', 'No household matches this invitation code');
  }
  if (!(await assignHousehold(userId, household._id))) throw alreadyInHousehold();
  return toPublicHousehold(household);
}

/** SDD 5: GET /households/{id} returns the household, its members and the invitation code. */
export async function getHouseholdWithMembers(householdId) {
  const household = await Household.findById(householdId).lean();
  if (!household) throw notFound('HOUSEHOLD_NOT_FOUND', 'Household not found');

  const members = await User.find({ householdId }).select('name').sort({ createdAt: 1 }).lean();
  return {
    ...toPublicHousehold(household),
    members: members.map((member) => ({ id: String(member._id), name: member.name })),
  };
}

/**
 * FR-ACC-10 / FR-ACC-11. Leaving is refused while this member still owes someone.
 * The last member deletes the household and all of its data.
 */
export async function leaveHousehold(userId, householdId) {
  await runAtomically(async (session) => {
    const debts = await getDebtsInvolving(userId, householdId, session);
    if (debts.length > 0) {
      throw new AppError(409, 'CONFLICT', 'Settle what you owe before leaving the household', {
        reason: 'DEBTS_NOT_SETTLED',
        debts,
      });
    }

    const options = session ? { session } : {};
    const updated = await User.updateOne(
      { _id: userId, householdId },
      { $set: { householdId: null } },
      options,
    );
    if (updated.matchedCount !== 1) {
      throw conflict('ALREADY_LEFT', 'You are no longer a member of this household');
    }

    const remaining = await User.countDocuments({ householdId }, options);
    if (remaining === 0) await deleteHouseholdData(householdId, session);
  });

  disconnectUser(userId);
}
