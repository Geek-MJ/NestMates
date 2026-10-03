import Expense from '../../models/Expense.js';
import Settlement from '../../models/Settlement.js';
import { conflict, validationError } from '../../utils/AppError.js';
import { FIELD_ERRORS } from '../../utils/validation.js';
import { HISTORY_PAGE_SIZE, pageResult, readPage } from '../../utils/pagination.js';
import { loadCurrentMembers, loadPeople, memberIdSet, presentPerson } from '../../utils/people.js';
import { runAtomically } from '../../utils/transaction.js';
import { getDebts } from './debtService.js';
import { splitEqually } from './debtMath.js';

function assertMembers(ids, members, field) {
  const known = memberIdSet(members);
  if (ids.some((id) => !known.has(String(id)))) {
    throw validationError([{ field, code: FIELD_ERRORS.NOT_MEMBER }]);
  }
}

async function presentExpenses(householdId, expenses) {
  const ids = expenses.flatMap((expense) => [
    expense.payerId,
    ...expense.shares.map((share) => share.userId),
  ]);
  const people = await loadPeople(ids);
  return expenses.map((expense) => ({
    id: String(expense._id),
    payer: presentPerson(expense.payerId, householdId, people),
    amountCents: expense.amountCents,
    date: expense.date,
    category: expense.category,
    description: expense.description ?? null,
    shares: expense.shares.map((share) => ({
      user: presentPerson(share.userId, householdId, people),
      amountCents: share.amountCents,
    })),
    createdAt: expense.createdAt,
  }));
}

async function presentSettlements(householdId, settlements) {
  const ids = settlements.flatMap((settlement) => [settlement.fromUserId, settlement.toUserId]);
  const people = await loadPeople(ids);
  return settlements.map((settlement) => ({
    id: String(settlement._id),
    from: presentPerson(settlement.fromUserId, householdId, people),
    to: presentPerson(settlement.toUserId, householdId, people),
    amountCents: settlement.amountCents,
    createdAt: settlement.createdAt,
  }));
}

/** FR-EXP-01 to FR-EXP-04. Shares are computed here and never taken from the client. */
export async function createExpense(householdId, userId, input) {
  const members = await loadCurrentMembers(householdId);
  assertMembers([input.payerId], members, 'payerId');
  assertMembers(input.participantIds, members, 'participantIds');

  const shares = splitEqually(input.amountCents, input.participantIds);
  const expense = await Expense.create({
    householdId,
    payerId: input.payerId,
    amountCents: input.amountCents,
    date: input.date,
    category: input.category,
    description: input.description,
    shares,
    createdBy: userId,
  });

  const [presented] = await presentExpenses(householdId, [expense]);
  return { expense: presented, debts: await getDebts(householdId) };
}

export async function listExpenses(householdId, query) {
  const page = readPage(query);
  const filter = { householdId };
  const [total, expenses] = await Promise.all([
    Expense.countDocuments(filter),
    Expense.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * HISTORY_PAGE_SIZE)
      .limit(HISTORY_PAGE_SIZE)
      .lean(),
  ]);
  return pageResult(await presentExpenses(householdId, expenses), { page, total });
}

export async function listSettlements(householdId, query) {
  const page = readPage(query);
  const filter = { householdId };
  const [total, settlements] = await Promise.all([
    Settlement.countDocuments(filter),
    Settlement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * HISTORY_PAGE_SIZE)
      .limit(HISTORY_PAGE_SIZE)
      .lean(),
  ]);
  return pageResult(await presentSettlements(householdId, settlements), { page, total });
}

/**
 * FR-EXP-07: either member concerned may settle. The amount is the full current debt,
 * recomputed on the server (SDD 6.1).
 */
export async function settleDebt(householdId, userId, { counterpartId }) {
  if (counterpartId === String(userId)) {
    throw validationError([{ field: 'counterpartId', code: FIELD_ERRORS.INVALID_FORMAT }]);
  }

  return runAtomically(async (session) => {
    const members = await loadCurrentMembers(householdId, session);
    assertMembers([userId, counterpartId], members, 'counterpartId');

    const { debts } = await getDebts(householdId, session);
    const debt = debts.find(
      (item) =>
        (item.from.id === String(userId) && item.to.id === counterpartId) ||
        (item.to.id === String(userId) && item.from.id === counterpartId),
    );
    if (!debt) {
      throw conflict('NO_DEBT', 'There is no amount left to settle between these members');
    }

    const [settlement] = await Settlement.create(
      [
        {
          householdId,
          fromUserId: debt.from.id,
          toUserId: debt.to.id,
          amountCents: debt.amountCents,
          createdBy: userId,
        },
      ],
      session ? { session } : {},
    );
    const [presented] = await presentSettlements(householdId, [settlement]);
    return { settlement: presented, debts: await getDebts(householdId, session) };
  });
}
