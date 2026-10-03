import { parseCreateHousehold, parseJoinHousehold } from './households.validation.js';
import { createHousehold, getHouseholdWithMembers, joinHousehold, leaveHousehold } from './households.service.js';

export const householdsController = {
  async create(req, res) {
    const household = await createHousehold(req.auth.userId, parseCreateHousehold(req.body));
    res.status(201).json(household);
  },

  async join(req, res) {
    res.json(await joinHousehold(req.auth.userId, parseJoinHousehold(req.body)));
  },

  async getOne(req, res) {
    res.json(await getHouseholdWithMembers(req.householdId));
  },

  async leave(req, res) {
    await leaveHousehold(req.auth.userId, req.householdId);
    res.status(204).end();
  },
};
