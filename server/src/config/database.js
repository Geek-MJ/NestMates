import mongoose from 'mongoose';
import '../models/Document.js';
import '../models/Event.js';
import '../models/Expense.js';
import '../models/Household.js';
import '../models/Message.js';
import '../models/Settlement.js';
import '../models/Task.js';
import '../models/User.js';
import logger, { serializeError } from '../utils/logger.js';

// Reject query selector injection: operator objects coming from user input are wrapped in $eq.
// Queries that need operators on purpose use mongoose.trusted().
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);
// The server only listens once connected; during an outage, requests fail fast with 503
// instead of waiting in Mongoose's buffer.
mongoose.set('bufferCommands', false);

const STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

let listenersAttached = false;

function attachConnectionListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  const { connection } = mongoose;
  connection.on('disconnected', () => logger.warn('database.disconnected'));
  connection.on('reconnected', () => logger.info('database.reconnected'));
  connection.on('error', (error) => logger.error('database.error', { error: serializeError(error) }));
}

/** Actual state of the MongoDB connection, as reported by the driver. */
export function getDatabaseState() {
  return STATES[mongoose.connection.readyState] ?? 'unknown';
}

export async function connectDatabase(uri) {
  attachConnectionListeners();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  // Build the unique indexes (email, invitationCode) before accepting requests.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  logger.info('database.connected', { database: mongoose.connection.name });
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
