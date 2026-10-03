/**
 * Equal split and pairwise debts (SRS FR-EXP-03 to FR-EXP-06, SDD 6.2).
 * Pure functions: every amount is an integer number of cents.
 */

export function splitEqually(amountCents, participantIds) {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new TypeError('amountCents must be a positive integer');
  }
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    throw new TypeError('participantIds must be a non-empty array');
  }

  const ids = [...participantIds].map(String).sort();
  const base = Math.floor(amountCents / ids.length);
  let remainder = amountCents - base * ids.length;

  return ids.map((userId) => ({
    userId,
    amountCents: base + (remainder-- > 0 ? 1 : 0),
  }));
}

function addOwed(owed, from, to, cents) {
  if (!from || !to || from === to || !cents) return;
  const key = `${from}\0${to}`;
  owed.set(key, (owed.get(key) ?? 0) + cents);
}

/**
 * Net debt between every pair, and each person's balance (positive: owed money).
 * Expenses contribute shares owed to the payer. Settlements reduce what `from` owes `to`.
 */
export function computePairDebts(expenses, settlements) {
  const owed = new Map();

  for (const expense of expenses) {
    const payer = String(expense.payerId);
    for (const share of expense.shares ?? []) {
      const participant = String(share.userId);
      if (participant !== payer) addOwed(owed, participant, payer, share.amountCents);
    }
  }

  for (const settlement of settlements) {
    addOwed(owed, String(settlement.fromUserId), String(settlement.toUserId), -settlement.amountCents);
  }

  const people = new Set();
  for (const key of owed.keys()) {
    const [from, to] = key.split('\0');
    people.add(from);
    people.add(to);
  }

  const ids = [...people].sort();
  const debts = [];
  const balanceById = new Map();

  function shift(debtorId, creditorId, amountCents) {
    balanceById.set(debtorId, (balanceById.get(debtorId) ?? 0) - amountCents);
    balanceById.set(creditorId, (balanceById.get(creditorId) ?? 0) + amountCents);
  }

  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const a = ids[i];
      const b = ids[j];
      const net = (owed.get(`${a}\0${b}`) ?? 0) - (owed.get(`${b}\0${a}`) ?? 0);
      if (net > 0) {
        debts.push({ fromUserId: a, toUserId: b, amountCents: net });
        shift(a, b, net);
      } else if (net < 0) {
        debts.push({ fromUserId: b, toUserId: a, amountCents: -net });
        shift(b, a, -net);
      }
    }
  }

  debts.sort(
    (left, right) =>
      right.amountCents - left.amountCents ||
      left.fromUserId.localeCompare(right.fromUserId) ||
      left.toUserId.localeCompare(right.toUserId),
  );

  return { debts, balanceById };
}
