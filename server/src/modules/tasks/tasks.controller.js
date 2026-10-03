import { parseCreateTask, parseTaskStatus } from './tasks.validation.js';
import { completeTask, createTask, listTasks } from './tasks.service.js';

export const tasksController = {
  async list(req, res) {
    res.json(await listTasks(req.householdId));
  },

  async create(req, res) {
    res.status(201).json(await createTask(req.householdId, req.auth.userId, parseCreateTask(req.body)));
  },

  async update(req, res) {
    parseTaskStatus(req.body);
    res.json(await completeTask(req.householdId, req.params.taskId));
  },
};
