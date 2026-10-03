import { parseCreateEvent, parseMonth, parseUpdateEvent } from './calendar.validation.js';
import { createEvent, deleteEvent, listEvents, updateEvent } from './calendar.service.js';

export const calendarController = {
  async list(req, res) {
    res.json(await listEvents(req.householdId, parseMonth(req.query)));
  },

  async create(req, res) {
    res.status(201).json(await createEvent(req.householdId, req.auth.userId, parseCreateEvent(req.body)));
  },

  async update(req, res) {
    res.json(await updateEvent(req.householdId, req.params.eventId, parseUpdateEvent(req.body)));
  },

  async remove(req, res) {
    await deleteEvent(req.householdId, req.params.eventId);
    res.status(204).end();
  },
};
