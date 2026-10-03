import mongoose from 'mongoose';
import Document from '../../models/Document.js';
import Event from '../../models/Event.js';
import Expense from '../../models/Expense.js';
import Household from '../../models/Household.js';
import Message from '../../models/Message.js';
import Settlement from '../../models/Settlement.js';
import Task from '../../models/Task.js';

function optionsFor(session) {
  return session ? { session } : {};
}

/** FR-ACC-11: the household and everything it owns, including GridFS files and messages. */
export async function deleteHouseholdData(householdId, session = null) {
  const options = optionsFor(session);
  const documents = await Document.find({ householdId }).select('gridFsFileId').setOptions(options).lean();
  const fileIds = documents.map((document) => document.gridFsFileId).filter(Boolean);
  if (fileIds.length > 0) {
    const db = mongoose.connection.db;
    await db.collection('fs.files').deleteMany({ _id: { $in: fileIds } }, options);
    await db.collection('fs.chunks').deleteMany({ files_id: { $in: fileIds } }, options);
  }

  await Promise.all([
    Expense.deleteMany({ householdId }, options),
    Settlement.deleteMany({ householdId }, options),
    Event.deleteMany({ householdId }, options),
    Task.deleteMany({ householdId }, options),
    Document.deleteMany({ householdId }, options),
    Message.deleteMany({ householdId }, options),
  ]);
  await Household.deleteOne({ _id: householdId }, options);
}
