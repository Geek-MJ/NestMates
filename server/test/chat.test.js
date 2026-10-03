import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { io as connectClient } from 'socket.io-client';
import Message from '../src/models/Message.js';
import { resetChatRateLimits } from '../src/modules/chat/rateLimit.js';
import { createTranslationService } from '../src/services/translationService.js';
import { clearDatabase, closeDatabase, createSharedHousehold, startTestServer } from './helpers.js';

function connect(baseUrl, token) {
  const socket = connectClient(baseUrl, {
    auth: { token },
    reconnection: false,
    transports: ['websocket'],
  });
  return new Promise((resolve) => {
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (error) => resolve(Object.assign(socket, { failed: error })));
  });
}

function once(socket, event) {
  return new Promise((resolve) => {
    socket.once(event, resolve);
  });
}

let translateCalls = 0;

function translation() {
  return createTranslationService({
    timeoutMs: 80,
    detect: async (text) => {
      if (text === 'fail') throw new Error('detection down');
      if (text === 'slow') return new Promise(() => {});
      if (text === '🎉') return { language: 'und', confidence: 0.2 };
      if (text === 'Bonjour') return { language: 'fr', confidence: 0.99 };
      if (text === 'Hola') return { language: 'es', confidence: 0.99 };
      return { language: 'en', confidence: 0.99 };
    },
    translate: async (text, target) => {
      translateCalls += 1;
      if (text === 'break') throw new Error('translation down');
      if (text === 'slow-translate') return new Promise(() => {});
      if (text === 'Bonjour') return { text: 'Hello', detectedSourceLanguage: 'fr' };
      if (target === 'en') return { text, detectedSourceLanguage: 'en' };
      return { text: `FR:${text}`, detectedSourceLanguage: 'en' };
    },
  });
}

describe('household chat', () => {
  let server;
  const sockets = [];

  before(async () => {
    server = await startTestServer({ translation: translation() });
  });

  beforeEach(async () => {
    resetChatRateLimits();
    translateCalls = 0;
    await clearDatabase();
  });

  after(async () => {
    sockets.forEach((socket) => socket.disconnect());
    await clearDatabase();
    await server.close();
    await closeDatabase();
  });

  async function open(token) {
    const socket = await connect(server.baseUrl, token);
    sockets.push(socket);
    assert.equal(socket.failed, undefined);
    return socket;
  }

  function send(socket, text) {
    return new Promise((resolve) => {
      socket.emit('chat:send', { text }, resolve);
    });
  }

  it('stores the original message and delivers it only inside the household', async () => {
    const home = await createSharedHousehold(server.request, 2);
    const other = await createSharedHousehold(server.request);
    const sender = await open(home.accounts[0].token);
    const roommate = await open(home.accounts[1].token);
    const stranger = await open(other.accounts[0].token);

    let leaked = false;
    stranger.on('chat:message', () => {
      leaked = true;
    });
    const incoming = once(roommate, 'chat:message');
    const ack = await send(sender, 'Bonjour');
    const delivered = await incoming;

    assert.equal(ack.message.originalText, 'Bonjour');
    assert.equal(ack.message.sourceLang, 'fr');
    assert.equal(ack.message.translatedText, undefined);
    assert.equal(translateCalls, 0);
    assert.equal(delivered.message.id, ack.message.id);
    assert.equal(delivered.message.sender.name, home.accounts[0].name);
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(leaked, false);

    const english = await send(sender, 'Hello');
    assert.equal(english.message.sourceLang, 'en');
    assert.equal(english.message.originalText, 'Hello');

    const history = await server.request(
      'GET',
      `/households/${home.household.id}/messages`,
      { token: home.accounts[1].token },
    );
    assert.equal(history.body.messages.at(-1).originalText, 'Hello');
    assert.equal(history.body.hasMore, false);

    const hidden = await server.request('GET', `/households/${home.household.id}/messages`, {
      token: other.accounts[0].token,
    });
    assert.equal(hidden.status, 403);
  });

  it('keeps the original text when translation fails or the language is unsupported', async () => {
    const home = await createSharedHousehold(server.request);
    const socket = await open(home.accounts[0].token);

    const failed = await send(socket, 'fail');
    assert.equal(failed.message.originalText, 'fail');
    assert.equal(failed.message.sourceLang, null);

    const slow = await send(socket, 'slow');
    assert.equal(slow.message.originalText, 'slow');
    assert.equal(slow.message.sourceLang, null);

    const emoji = await send(socket, '🎉');
    assert.equal(emoji.message.originalText, '🎉');
    assert.equal(emoji.message.sourceLang, null);

    const otherLanguage = await send(socket, 'Hola');
    assert.equal(otherLanguage.message.originalText, 'Hola');
    assert.equal(otherLanguage.message.sourceLang, null);

    const empty = await send(socket, '   ');
    assert.equal(empty.error.code, 'VALIDATION_ERROR');
  });

  it('relays typing to the other members and drops a burst', async () => {
    const home = await createSharedHousehold(server.request, 2);
    const sender = await open(home.accounts[0].token);
    const roommate = await open(home.accounts[1].token);
    const first = once(roommate, 'chat:typing');
    sender.emit('chat:typing');
    sender.emit('chat:typing');
    const typing = await first;
    assert.equal(typing.userId, home.roster[0].id);
    assert.equal(typing.name, home.accounts[0].name);

    let extra = 0;
    roommate.on('chat:typing', () => {
      extra += 1;
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    assert.equal(extra, 0);
  });

  it('returns history in pages of 50, oldest first within the page', async () => {
    const home = await createSharedHousehold(server.request);
    const start = Date.parse('2026-01-01T00:00:00.000Z');
    await Message.insertMany(
      Array.from({ length: 51 }, (_, index) => ({
        householdId: home.household.id,
        senderId: home.roster[0].id,
        originalText: `m${index}`,
        sourceLang: null,
        translatedText: null,
        translatedLang: null,
        createdAt: new Date(start + index * 1000),
      })),
    );

    const latest = await server.request('GET', `/households/${home.household.id}/messages`, {
      token: home.accounts[0].token,
    });
    assert.equal(latest.body.messages.length, 50);
    assert.equal(latest.body.hasMore, true);
    assert.equal(latest.body.messages[0].originalText, 'm1');
    assert.equal(latest.body.messages.at(-1).originalText, 'm50');

    const older = await server.request(
      'GET',
      `/households/${home.household.id}/messages?before=${encodeURIComponent(latest.body.messages[0].createdAt)}`,
      { token: home.accounts[0].token },
    );
    assert.equal(older.body.messages.length, 1);
    assert.equal(older.body.messages[0].originalText, 'm0');
    assert.equal(older.body.hasMore, false);
  });

  it('translates one existing message into the requested language and caches that target', async () => {
    const home = await createSharedHousehold(server.request, 2);
    const other = await createSharedHousehold(server.request);
    const socket = await open(home.accounts[0].token);
    const sent = await send(socket, 'Hello');
    const messageId = sent.message.id;
    const before = await Message.countDocuments({ householdId: home.household.id });

    const french = await server.request(
      'POST',
      `/households/${home.household.id}/messages/${messageId}/translate`,
      { token: home.accounts[1].token, body: { targetLanguage: 'fr' } },
    );
    assert.equal(french.status, 200);
    assert.equal(french.body.originalText, 'Hello');
    assert.equal(french.body.translatedText, 'FR:Hello');
    assert.equal(french.body.sourceLanguage, 'en');
    assert.equal(french.body.targetLanguage, 'fr');
    assert.equal(translateCalls, 1);

    const again = await server.request(
      'POST',
      `/households/${home.household.id}/messages/${messageId}/translate`,
      { token: home.accounts[1].token, body: { targetLanguage: 'fr' } },
    );
    assert.equal(again.status, 200);
    assert.equal(again.body.translatedText, 'FR:Hello');
    assert.equal(translateCalls, 1);

    const stored = await Message.findById(messageId).lean();
    assert.equal(stored.originalText, 'Hello');
    assert.equal(stored.translatedLang, 'fr');
    assert.equal(await Message.countDocuments({ householdId: home.household.id }), before);

    const history = await server.request(
      'GET',
      `/households/${home.household.id}/messages`,
      { token: home.accounts[0].token },
    );
    assert.equal(history.body.messages.at(-1).originalText, 'Hello');
    assert.equal(history.body.messages.at(-1).translatedText, undefined);

    const sameLanguage = await server.request(
      'POST',
      `/households/${home.household.id}/messages/${messageId}/translate`,
      { token: home.accounts[0].token, body: { targetLanguage: 'en' } },
    );
    assert.equal(sameLanguage.status, 400);

    const invalid = await server.request(
      'POST',
      `/households/${home.household.id}/messages/${messageId}/translate`,
      { token: home.accounts[0].token, body: { targetLanguage: 'es' } },
    );
    assert.equal(invalid.status, 400);

    const stranger = await server.request(
      'POST',
      `/households/${home.household.id}/messages/${messageId}/translate`,
      { token: other.accounts[0].token, body: { targetLanguage: 'fr' } },
    );
    assert.equal(stranger.status, 403);

    const missing = await server.request(
      'POST',
      `/households/${other.household.id}/messages/${messageId}/translate`,
      { token: other.accounts[0].token, body: { targetLanguage: 'en' } },
    );
    assert.equal(missing.status, 404);

    const anonymous = await server.request(
      'POST',
      `/households/${home.household.id}/messages/${messageId}/translate`,
      { body: { targetLanguage: 'fr' } },
    );
    assert.equal(anonymous.status, 401);
  });

  it('leaves the original message unchanged when translation fails', async () => {
    const home = await createSharedHousehold(server.request);
    const socket = await open(home.accounts[0].token);
    const sent = await send(socket, 'break');
    const failed = await server.request(
      'POST',
      `/households/${home.household.id}/messages/${sent.message.id}/translate`,
      { token: home.accounts[0].token, body: { targetLanguage: 'fr' } },
    );
    assert.equal(failed.status, 503);
    assert.equal(failed.body.error.details.reason, 'TRANSLATION_UNAVAILABLE');
    const stored = await Message.findById(sent.message.id).lean();
    assert.equal(stored.originalText, 'break');
    assert.equal(stored.translatedText, null);

    const slow = await send(socket, 'slow-translate');
    const timedOut = await server.request(
      'POST',
      `/households/${home.household.id}/messages/${slow.message.id}/translate`,
      { token: home.accounts[0].token, body: { targetLanguage: 'fr' } },
    );
    assert.equal(timedOut.status, 503);
    const stillOriginal = await Message.findById(slow.message.id).lean();
    assert.equal(stillOriginal.originalText, 'slow-translate');
    assert.equal(stillOriginal.translatedText, null);
  });

  it('limits a member to 10 messages in 10 seconds', async () => {
    const home = await createSharedHousehold(server.request);
    const socket = await open(home.accounts[0].token);
    for (let index = 0; index < 10; index += 1) {
      const sent = await send(socket, `note ${index}`);
      assert.equal(sent.message.originalText, `note ${index}`);
    }
    const blocked = await send(socket, 'one more');
    assert.equal(blocked.error.code, 'RATE_LIMITED');
    assert.equal(blocked.error.details.reason, 'CHAT_RATE_LIMIT');
  });
});
