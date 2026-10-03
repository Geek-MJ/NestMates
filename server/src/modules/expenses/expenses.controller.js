import { getDebts } from './debtService.js';
import { parseExpense, parseSettlement } from './expenses.validation.js';
import { createExpense, listExpenses, listSettlements, settleDebt } from './expenses.service.js';

export const expensesController = {
  async list(req, res) {
    res.json(await listExpenses(req.householdId, req.query));
  },

  async create(req, res) {
    const result = await createExpense(req.householdId, req.auth.userId, parseExpense(req.body));
    res.status(201).json(result);
  },

  async debts(req, res) {
    res.json(await getDebts(req.householdId));
  },

  async listSettlements(req, res) {
    res.json(await listSettlements(req.householdId, req.query));
  },

  async settle(req, res) {
    const result = await settleDebt(req.householdId, req.auth.userId, parseSettlement(req.body));
    res.status(201).json(result);
  },
};
