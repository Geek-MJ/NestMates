import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import DevSeed, { DEV_SEED_KEY } from '../models/DevSeed.js';
import DocumentModel from '../models/Document.js';
import Event from '../models/Event.js';
import Expense from '../models/Expense.js';
import Household from '../models/Household.js';
import Message from '../models/Message.js';
import Settlement from '../models/Settlement.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { createEvent } from '../modules/calendar/calendar.service.js';
import { sendMessage } from '../modules/chat/chat.service.js';
import { deleteDocument, uploadDocument } from '../modules/documents/documents.service.js';
import { createExpense, settleDebt } from '../modules/expenses/expenses.service.js';
import { getDebts } from '../modules/expenses/debtService.js';
import { completeTask, createTask } from '../modules/tasks/tasks.service.js';
import { createTranslationService } from '../services/translationService.js';
import { getBucket } from '../modules/documents/storage.js';
import logger, { serializeError } from '../utils/logger.js';
import { assertDevelopmentSeed } from './guard.js';

/**
 * Development-only sample records for the one existing two-member household.
 *
 *   npm run seed:dev
 *   npm run seed:dev -- --remove
 *
 * The second command deletes only the rows recorded in DevSeed. It does not
 * touch the household, its members, or any records created through the app.
 */

function monthDay(day) {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function euros(cents) {
  return (cents / 100).toFixed(2);
}

function tinyPdf(title) {
  const safe = title.replace(/[()\\]/g, '');
  const stream = `BT /F1 12 Tf 36 64 Td (${safe}) Tj ET`;
  const objects = [
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 320 140]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj',
    `4 0 obj<</Length ${Buffer.byteLength(stream)}>>stream\n${stream}\nendstream\nendobj`,
    '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj',
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body));
    body += `${object}\n`;
  }
  const xref = Buffer.byteLength(body);
  let xrefBody = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    xrefBody += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  xrefBody += `trailer<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body + xrefBody);
}

async function findSeedHousehold() {
  const users = await User.find().select('name householdId language').lean();
  const grouped = new Map();
  for (const user of users) {
    if (!user.householdId) continue;
    const id = String(user.householdId);
    const members = grouped.get(id) ?? [];
    members.push(user);
    grouped.set(id, members);
  }
  const candidates = [...grouped.entries()].filter(([, members]) => members.length >= 2);
  if (candidates.length === 0) {
    throw new Error(
      'No household with at least two members was found. Nothing was created. Join a second member, then run the seed again.',
    );
  }
  if (candidates.length > 1) {
    throw new Error(
      `Found ${candidates.length} households with at least two members. Nothing was created, because the seed will not guess which household to use.`,
    );
  }
  const [householdId, members] = candidates[0];
  if (members.length !== 2) {
    throw new Error(
      `The only shared household has ${members.length} members. This seed is written for exactly two, so nothing was added.`,
    );
  }
  members.sort((left, right) => String(left._id).localeCompare(String(right._id)));
  const household = await Household.findById(householdId).select('name').lean();
  return { householdId, name: household?.name ?? 'Household', members };
}

async function addExpense(householdId, actorId, { payerId, amountCents, date, category, description }, both) {
  const created = await createExpense(householdId, actorId, {
    payerId,
    participantIds: both,
    amountCents,
    date,
    category,
    description,
  });
  return created.expense.id;
}

const CONVERSATION = [
  { who: 'Mahij', text: 'Do we need anything from the grocery store?', sourceLang: 'en' },
  { who: 'Preeti', text: 'Oui, il nous faut du lait et des œufs.', sourceLang: 'fr' },
  { who: 'Mahij', text: 'I can go after class.', sourceLang: 'en' },
  { who: 'Preeti', text: 'Je peux vérifier la liste des courses.', sourceLang: 'fr' },
  { who: 'Mahij', text: 'I also added dinner to the calendar.', sourceLang: 'en' },
  { who: 'Preeti', text: 'Parfait, je serai à la maison vers 19 heures.', sourceLang: 'fr' },
];

function memberNamed(members, label) {
  const member = members.find((item) => item.name.toLowerCase().includes(label.toLowerCase()));
  if (!member) {
    throw new Error(`Could not find ${label} in the household. No chat messages were changed.`);
  }
  return member;
}

async function ensureDevelopmentLanguages(members) {
  const wanted = [
    ['Mahij', 'en'],
    ['Preeti', 'fr'],
  ];
  for (const [label, language] of wanted) {
    const member = memberNamed(members, label);
    if (member.language === language) continue;
    await User.updateOne({ _id: member._id }, { $set: { language } });
    member.language = language;
    logger.info('seed.language', { name: member.name, language });
  }
}

async function writeConversation(householdId, members) {
  const translation = createTranslationService({ apiKey: process.env.GOOGLE_TRANSLATE_API_KEY ?? '' });
  if (!translation.isConfigured) {
    throw new Error('Google Cloud Translation is not configured. No chat messages were changed.');
  }
  const messageIds = [];
  try {
    for (const line of CONVERSATION) {
      const sender = memberNamed(members, line.who);
      const message = await sendMessage({
        householdId,
        userId: String(sender._id),
        body: { text: line.text },
        translation,
      });
      if (message.sourceLang !== line.sourceLang || message.translatedText) {
        throw new Error(
          `Google did not confidently detect ${line.sourceLang} for ${line.who}. No fake translation was stored.`,
        );
      }
      messageIds.push(message.id);
    }
  } catch (error) {
    for (const id of messageIds) await Message.deleteOne({ _id: id });
    throw error;
  }
  return messageIds;
}

async function refreshConversation(householdId, members, existing) {
  const current = [];
  for (const id of existing.messageIds ?? []) {
    const message = await Message.findById(id).select('originalText sourceLang translatedText').lean();
    if (message) current.push(message);
  }
  const sameScript = current.length === CONVERSATION.length
    && current.every((message, index) => (
      message.originalText === CONVERSATION[index].text
      && message.sourceLang === CONVERSATION[index].sourceLang
      && !message.translatedText
    ));
  if (sameScript) {
    logger.info('seed.conversation_kept', { messages: current.length });
    return;
  }
  const messageIds = await writeConversation(householdId, members);
  await Message.deleteMany({ householdId, _id: mongoose.trusted({ $nin: messageIds }) });
  await DevSeed.updateOne({ _id: existing._id }, { $set: { messageIds } });
  logger.info('seed.conversation_replaced', { removed: (existing.messageIds ?? []).length, messages: messageIds.length });
}

async function applySeed() {
  const { householdId, name, members } = await findSeedHousehold();
  await ensureDevelopmentLanguages(members);
  const existing = await DevSeed.findOne({ key: DEV_SEED_KEY, householdId });
  if (existing) {
    await refreshConversation(householdId, members, existing);
    logger.info('seed.already_applied', {
      household: name,
      detail: 'Household records were left in place. Chat was refreshed only when the development conversation differed.',
    });
    return;
  }

  const [first, second] = members;
  const both = [String(first._id), String(second._id)];
  const openBefore = await getDebts(householdId);
  const canSettle = openBefore.debts.length === 0;

  const expenseIds = [];
  if (canSettle) {
    expenseIds.push(
      await addExpense(householdId, String(first._id), {
        payerId: String(first._id),
        amountCents: 3240,
        date: daysAgo(28),
        category: 'groceries',
        description: 'Saturday market',
      }, both),
      await addExpense(householdId, String(second._id), {
        payerId: String(second._id),
        amountCents: 4800,
        date: daysAgo(21),
        category: 'bills',
        description: 'Electricity',
      }, both),
      await addExpense(householdId, String(first._id), {
        payerId: String(first._id),
        amountCents: 1280,
        date: daysAgo(16),
        category: 'transport',
        description: 'Metro cards',
      }, both),
    );
  }

  let settlementId = null;
  if (canSettle) {
    const settled = await settleDebt(householdId, String(first._id), { counterpartId: String(second._id) });
    settlementId = settled.settlement.id;
  }

  const openExpenses = [
    { payer: second, amountCents: 2750, date: daysAgo(2), category: 'groceries', description: 'Evening shop' },
    { payer: first, amountCents: 1690, date: daysAgo(1), category: 'household', description: 'Cleaning supplies' },
    { payer: first, amountCents: 2200, date: daysAgo(0), category: 'leisure', description: 'Film night' },
    { payer: first, amountCents: 5400, date: monthDay(20), category: 'bills', description: 'Internet' },
    { payer: second, amountCents: 960, date: monthDay(24), category: 'transport', description: 'Shared bikes' },
  ];
  for (const item of openExpenses) {
    expenseIds.push(
      await addExpense(householdId, String(item.payer._id), {
        payerId: String(item.payer._id),
        amountCents: item.amountCents,
        date: item.date,
        category: item.category,
        description: item.description,
      }, both),
    );
  }

  const events = [
    { title: 'Rent reminder', date: monthDay(1), time: '09:00', description: 'Transfer the rent from the shared account.' },
    { title: 'Grocery shopping', date: monthDay(4), time: '11:00', description: 'Market list is on the fridge.' },
    { title: 'Flat dinner', date: monthDay(8), time: '19:30', description: 'Kitchen at half past seven.' },
    { title: 'Cleaning day', date: monthDay(11), time: '10:00', description: 'Kitchen, bathroom and the hallway.' },
    { title: 'Household meeting', date: monthDay(15), time: '18:30', description: 'A short check-in about the month.' },
  ];
  const eventIds = [];
  for (const event of events) {
    const created = await createEvent(householdId, String(first._id), event);
    eventIds.push(created.id);
  }

  const tasks = [
    { title: 'Take out the bins', assignee: first, dueDate: monthDay(6), done: false },
    { title: 'Clean the kitchen', assignee: second, dueDate: monthDay(5), done: false },
    { title: 'Buy groceries', assignee: first, dueDate: monthDay(3), done: true },
    { title: 'Clean the bathroom', assignee: second, dueDate: monthDay(12), done: false },
    { title: 'Pay the electricity bill', assignee: first, dueDate: monthDay(2), done: true },
  ];
  const taskIds = [];
  for (const task of tasks) {
    const created = await createTask(householdId, String(first._id), {
      title: task.title,
      assigneeId: String(task.assignee._id),
      dueDate: task.dueDate,
    });
    if (task.done) await completeTask(householdId, created.id);
    taskIds.push(created.id);
  }

  const messageIds = await writeConversation(householdId, members);

  const documentIds = [];
  for (const fileName of ['household-notes.pdf', 'grocery-list.pdf']) {
    const buffer = tinyPdf(fileName.replace('.pdf', ''));
    const uploaded = await uploadDocument(householdId, String(first._id), {
      buffer,
      mimetype: 'application/pdf',
      originalname: fileName,
      size: buffer.length,
    });
    documentIds.push(uploaded.id);
  }

  await DevSeed.create({
    key: DEV_SEED_KEY,
    householdId,
    expenseIds,
    settlementIds: settlementId ? [settlementId] : [],
    eventIds,
    taskIds,
    messageIds,
    documentIds,
  });

  const after = await getDebts(householdId);
  logger.info('seed.applied', {
    household: name,
    members: members.map((member) => member.name),
    expenses: expenseIds.length,
    settlements: settlementId ? 1 : 0,
    settlementSkipped: canSettle ? undefined : 'household already had an open debt',
    events: eventIds.length,
    tasks: taskIds.length,
    messages: messageIds.length,
    documents: documentIds.length,
    balances: after.balances.map((item) => ({ name: item.member.name, euros: euros(item.amountCents) })),
    debts: after.debts.map((debt) => ({
      from: debt.from.name,
      to: debt.to.name,
      euros: euros(debt.amountCents),
    })),
    remove: 'npm run seed:dev -- --remove',
  });
}

async function deleteIds(model, ids) {
  for (const id of ids ?? []) {
    await model.deleteOne({ _id: id });
  }
}

async function removeSeed() {
  const { householdId, name } = await findSeedHousehold();
  const record = await DevSeed.findOne({ key: DEV_SEED_KEY, householdId });
  if (!record) {
    logger.info('seed.nothing_to_remove', { household: name });
    return;
  }
  for (const documentId of record.documentIds) {
    await deleteDocument(householdId, String(documentId)).catch(async () => {
      const document = await DocumentModel.findById(documentId).lean();
      if (document?.gridFsFileId) {
        await getBucket().delete(document.gridFsFileId).catch(() => {});
      }
      await DocumentModel.deleteOne({ _id: documentId });
    });
  }
  await deleteIds(Message, record.messageIds);
  await deleteIds(Task, record.taskIds);
  await deleteIds(Event, record.eventIds);
  await deleteIds(Settlement, record.settlementIds);
  await deleteIds(Expense, record.expenseIds);
  await record.deleteOne();
  logger.info('seed.removed', {
    household: name,
    detail: 'Only the development seed records were deleted. The household and its other records were left as they were.',
  });
}

try {
  assertDevelopmentSeed();
  await connectDatabase(process.env.MONGODB_URI);
  await DevSeed.createIndexes();
  if (process.argv.includes('--remove')) await removeSeed();
  else await applySeed();
} catch (error) {
  logger.error('seed.failed', { error: serializeError(error) });
  process.exitCode = 1;
} finally {
  if (process.exitCode) {
    await disconnectDatabase().catch(() => {});
  } else {
    await disconnectDatabase();
  }
}
