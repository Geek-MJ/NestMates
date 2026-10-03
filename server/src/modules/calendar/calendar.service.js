import mongoose from 'mongoose';
import Event from '../../models/Event.js';
import { notFound } from '../../utils/AppError.js';
import { isObjectId } from '../../utils/ids.js';

function toPublicEvent(event) {
  return {
    id: String(event._id),
    title: event.title,
    date: event.date,
    time: event.time ?? null,
    description: event.description ?? null,
    createdBy: String(event.createdBy),
    createdAt: event.createdAt,
  };
}

export async function listEvents(householdId, month) {
  const events = await Event.find({
    householdId,
    date: mongoose.trusted({ $gte: `${month}-01`, $lte: `${month}-31` }),
  })
    .sort({ date: 1, time: 1, createdAt: 1 })
    .lean();
  return { events: events.map(toPublicEvent) };
}

export async function createEvent(householdId, userId, input) {
  const event = await Event.create({ ...input, householdId, createdBy: userId });
  return toPublicEvent(event);
}

async function findEvent(householdId, eventId) {
  if (!isObjectId(eventId)) throw notFound('EVENT_NOT_FOUND', 'Event not found');
  const event = await Event.findOne({ _id: eventId, householdId });
  if (!event) throw notFound('EVENT_NOT_FOUND', 'Event not found');
  return event;
}

export async function updateEvent(householdId, eventId, input) {
  const event = await findEvent(householdId, eventId);
  event.title = input.title;
  event.date = input.date;
  event.time = input.time;
  event.description = input.description;
  await event.save();
  return toPublicEvent(event);
}

export async function deleteEvent(householdId, eventId) {
  const event = await findEvent(householdId, eventId);
  await event.deleteOne();
}
