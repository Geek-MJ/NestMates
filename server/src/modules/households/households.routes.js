import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireMembership } from '../../middleware/requireMembership.js';
import { calendarController } from '../calendar/calendar.controller.js';
import { createChatController } from '../chat/chat.controller.js';
import { documentsController } from '../documents/documents.controller.js';
import { uploadDocument } from '../documents/upload.js';
import { expensesController } from '../expenses/expenses.controller.js';
import { tasksController } from '../tasks/tasks.controller.js';
import { householdsController } from './households.controller.js';

/**
 * Household routes (SDD 5). Every `/:id/...` route checks membership again in the database.
 */
export function createHouseholdsRouter({ config, translation }) {
  const router = Router();
  const chatController = createChatController(translation);

  router.use(authenticate(config.jwt));
  router.post('/', householdsController.create);
  router.post('/join', householdsController.join);
  router.get('/:id', requireMembership, householdsController.getOne);
  router.post('/:id/leave', requireMembership, householdsController.leave);

  router.get('/:id/expenses', requireMembership, expensesController.list);
  router.post('/:id/expenses', requireMembership, expensesController.create);
  router.get('/:id/debts', requireMembership, expensesController.debts);
  router.get('/:id/settlements', requireMembership, expensesController.listSettlements);
  router.post('/:id/settlements', requireMembership, expensesController.settle);

  router.get('/:id/events', requireMembership, calendarController.list);
  router.post('/:id/events', requireMembership, calendarController.create);
  router.put('/:id/events/:eventId', requireMembership, calendarController.update);
  router.delete('/:id/events/:eventId', requireMembership, calendarController.remove);

  router.get('/:id/documents', requireMembership, documentsController.list);
  router.post('/:id/documents', requireMembership, uploadDocument, documentsController.upload);
  router.get('/:id/documents/:documentId/content', requireMembership, documentsController.content);
  router.delete('/:id/documents/:documentId', requireMembership, documentsController.remove);

  router.get('/:id/tasks', requireMembership, tasksController.list);
  router.post('/:id/tasks', requireMembership, tasksController.create);
  router.patch('/:id/tasks/:taskId', requireMembership, tasksController.update);

  router.get('/:id/messages', requireMembership, chatController.history);
  router.post('/:id/messages/:messageId/translate', requireMembership, chatController.translate);

  return router;
}
