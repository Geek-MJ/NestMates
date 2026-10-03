import Expense from '../../models/Expense.js';
import Settlement from '../../models/Settlement.js';
import { loadCurrentMembers, loadPeople, memberIdSet, presentPerson } from '../../utils/people.js';
import { computePairDebts } from './debtMath.js';

function withSession(query, session) {
  return session ? query.session(session) : query;
}

async function loadActivity(householdId, session) {
  const [expenses, settlements, members] = await Promise.all([
    withSession(Expense.find({ householdId }).select('payerId shares'), session).lean(),
    withSession(Settlement.find({ householdId }).select('fromUserId toUserId amountCents'), session).lean(),
    loadCurrentMembers(householdId, session),
  ]);
  return { expenses, settlements, members };
}

function toPublicDebts(householdId, members, { debts, balanceById }, people) {
  const memberIds = memberIdSet(members);
  for (const member of members) {
    const id = String(member._id);
    if (!balanceById.has(id)) balanceById.set(id, 0);
  }

  return {
    debts: debts
      .filter((debt) => memberIds.has(debt.fromUserId) || memberIds.has(debt.toUserId))
      .map((debt) => ({
        from: presentPerson(debt.fromUserId, householdId, people),
        to: presentPerson(debt.toUserId, householdId, people),
        amountCents: debt.amountCents,
      })),
    balances: members.map((member) => ({
      member: { id: String(member._id), name: member.name },
      amountCents: balanceById.get(String(member._id)) ?? 0,
    })),
  };
}

/** Who owes whom, and the balance of each current member (FR-EXP-05, FR-EXP-06). */
export async function getDebts(householdId, session = null) {
  const { expenses, settlements, members } = await loadActivity(householdId, session);
  const computed = computePairDebts(expenses, settlements);
  const ids = [
    ...members.map((member) => member._id),
    ...computed.debts.flatMap((debt) => [debt.fromUserId, debt.toUserId]),
  ];
  const people = await loadPeople(ids, session);
  return toPublicDebts(householdId, members, computed, people);
}

/**
 * Open amounts that involve this member, as debtor or creditor.
 * Leaving requires a settled balance (BRD) and zero debts (FR-ACC-10).
 */
export async function getDebtsInvolving(userId, householdId, session = null) {
  const { debts } = await getDebts(householdId, session);
  const id = String(userId);
  return debts.filter((debt) => debt.amountCents > 0 && (debt.from.id === id || debt.to.id === id));
}
