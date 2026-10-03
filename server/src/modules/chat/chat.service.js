import mongoose from 'mongoose';
import Message from '../../models/Message.js';
import { badRequest, forbidden, notFound, serviceUnavailable, validationError } from '../../utils/AppError.js';
import { isMemberOf } from '../households/membership.js';
import { loadPeople, presentPerson } from '../../utils/people.js';
import { FIELD_ERRORS } from '../../utils/validation.js';
import { assertChatRateLimit } from './rateLimit.js';
import { parseBefore, parseMessageText, parseTargetLanguage } from './chat.validation.js';

export const MESSAGE_PAGE_SIZE = 50;

export function toPublicMessage(message, householdId, people) {
  return {
    id: String(message._id),
    sender: presentPerson(message.senderId, householdId, people),
    originalText: message.originalText,
    sourceLang: message.sourceLang === 'en' || message.sourceLang === 'fr' ? message.sourceLang : null,
    createdAt: message.createdAt,
  };
}

async function presentMessages(householdId, messages) {
  const people = await loadPeople(messages.map((message) => message.senderId));
  return messages.map((message) => toPublicMessage(message, householdId, people));
}

/** Latest page first, returned from oldest to newest (FR-CHT-09). */
export async function listMessages(householdId, query) {
  const before = parseBefore(query);
  const filter = { householdId };
  if (before) filter.createdAt = mongoose.trusted({ $lt: before });

  const found = await Message.find(filter).sort({ createdAt: -1 }).limit(MESSAGE_PAGE_SIZE + 1).lean();
  const hasMore = found.length > MESSAGE_PAGE_SIZE;
  const page = found.slice(0, MESSAGE_PAGE_SIZE).reverse();
  return { messages: await presentMessages(householdId, page), hasMore };
}

/**
 * Stores the original text immediately. Language detection records en or fr when
 * it is confident, and never writes a translation.
 */
export async function sendMessage({ householdId, userId, body, translation }) {
  if (!(await isMemberOf(userId, householdId))) {
    throw forbidden('NOT_HOUSEHOLD_MEMBER', 'You are not a member of this household');
  }
  const text = parseMessageText(body);
  assertChatRateLimit(String(userId));

  const sourceLang = await translation.detectSource(text);
  const message = await Message.create({
    householdId,
    senderId: userId,
    originalText: text,
    sourceLang,
    translatedText: null,
    translatedLang: null,
  });
  const [presented] = await presentMessages(householdId, [message]);
  return presented;
}

function translationView(message, targetLanguage) {
  return {
    originalText: message.originalText,
    translatedText: message.translatedText,
    sourceLanguage: message.sourceLang,
    targetLanguage,
  };
}

/**
 * Translates one existing message for the viewer who asked. The original text
 * stays on the same message. A cached result is reused only for the same target.
 */
export async function translateExistingMessage({ householdId, messageId, body, translation }) {
  const targetLanguage = parseTargetLanguage(body);
  if (!mongoose.isValidObjectId(messageId)) {
    throw notFound('MESSAGE_NOT_FOUND', 'Message not found');
  }
  const message = await Message.findOne({ _id: messageId, householdId });
  if (!message) throw notFound('MESSAGE_NOT_FOUND', 'Message not found');

  const sourceLanguage = message.sourceLang === 'en' || message.sourceLang === 'fr' ? message.sourceLang : null;
  if (!sourceLanguage) {
    throw badRequest('UNKNOWN_SOURCE_LANGUAGE', 'The message language is not available for translation');
  }
  if (sourceLanguage === targetLanguage) {
    throw validationError([{ field: 'targetLanguage', code: FIELD_ERRORS.INVALID_FORMAT }]);
  }

  if (message.translatedLang === targetLanguage && message.translatedText) {
    return translationView(message, targetLanguage);
  }

  const translated = await translation.translateTo(message.originalText, targetLanguage);
  if (!translated?.translatedText) {
    throw serviceUnavailable('TRANSLATION_UNAVAILABLE', 'Translation is unavailable right now');
  }

  message.translatedText = translated.translatedText;
  message.translatedLang = targetLanguage;
  await message.save();
  return translationView(message, targetLanguage);
}
