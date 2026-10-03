import { randomBytes } from 'node:crypto';
import http from 'node:http';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { loadConfig } from '../src/config/env.js';
import { createSocketServer } from '../src/realtime/socketServer.js';
import { createMailer } from '../src/services/mailer.js';
import { createTranslationService } from '../src/services/translationService.js';
import logger from '../src/utils/logger.js';

/**
 * Integration tests run against a real, disposable MongoDB database given by MONGODB_URI_TEST
 * (e.g. mongodb://127.0.0.1:27017/nestmates-test). Its collections are emptied between tests,
 * so the database name must contain "test".
 */
function testDatabaseUri() {
  const uri = process.env.MONGODB_URI_TEST;
  if (!uri) {
    throw new Error(
      'MONGODB_URI_TEST is not set. Point it to a disposable MongoDB database whose name contains ' +
        '"test" (see "Tests" in the README).',
    );
  }
  return uri;
}

export function createTestConfig(overrides = {}) {
  return loadConfig({
    NODE_ENV: 'test',
    MONGODB_URI: testDatabaseUri(),
    JWT_SECRET: randomBytes(32).toString('hex'),
    FRONTEND_ORIGIN: 'http://localhost:5173',
    AUTH_RATE_LIMIT_MAX: '1000',
    LOG_LEVEL: 'silent',
    ...overrides,
  });
}

/**
 * Test double for the SMTP mailer: messages go through Nodemailer's built-in JSON transport,
 * which builds the real message without delivering it, and are kept for assertions.
 */
export function createRecordingMailer() {
  const transport = nodemailer.createTransport({ jsonTransport: true });
  const sent = [];
  return {
    isConfigured: true,
    sent,
    async send(message) {
      const info = await transport.sendMail({ from: 'NestMates <no-reply@test.invalid>', ...message });
      sent.push(JSON.parse(info.message));
    },
    close() {},
  };
}

export async function startTestServer({
  config = createTestConfig(),
  mailer,
  translation = createTranslationService(),
} = {}) {
  logger.setLevel(config.logLevel);
  if (mongoose.connection.readyState !== 1) {
    await connectDatabase(config.mongodbUri);
  }
  if (!mongoose.connection.name.includes('test')) {
    throw new Error(`Refusing to run tests against database "${mongoose.connection.name}".`);
  }

  const app = createApp({ config, mailer: mailer ?? createMailer(config.smtp), translation });
  const server = http.createServer(app);
  const io = createSocketServer(server, { config, translation });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(method, path, { body, token, headers = {} } = {}) {
    const response = await fetch(`${baseUrl}/api${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
    const text = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      body: text ? JSON.parse(text) : null,
    };
  }

  return {
    baseUrl,
    config,
    io,
    request,
    async close() {
      await new Promise((resolve) => io.close(() => resolve()));
    },
  };
}

export async function clearDatabase() {
  await Promise.all(Object.values(mongoose.models).map((model) => model.deleteMany({})));
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.listCollections().toArray();
  await Promise.all(
    collections
      .filter((collection) => collection.name === 'fs.files' || collection.name === 'fs.chunks')
      .map((collection) => db.collection(collection.name).deleteMany({})),
  );
}

export async function closeDatabase() {
  await disconnectDatabase();
}

let accountCounter = 0;

/** Registers an account through the API, as a visitor would, and returns its token. */
export async function registerAccount(request, overrides = {}) {
  accountCounter += 1;
  const account = {
    name: `Test Flatmate ${accountCounter}`,
    email: `flatmate${accountCounter}.${Date.now()}@test.invalid`,
    password: 'correct horse 42',
    acceptPrivacy: true,
    ...overrides,
  };
  const response = await request('POST', '/auth/register', { body: account });
  if (response.status !== 201) {
    throw new Error(`Registration failed with ${response.status}: ${JSON.stringify(response.body)}`);
  }
  return { ...account, email: account.email.toLowerCase(), token: response.body.token };
}

/** Creates a household and joins `memberCount - 1` more real accounts. */
export async function createSharedHousehold(request, memberCount = 1) {
  const owner = await registerAccount(request);
  const created = await request('POST', '/households', {
    token: owner.token,
    body: { name: 'Shared flat' },
  });
  if (created.status !== 201) {
    throw new Error(`Household creation failed: ${JSON.stringify(created.body)}`);
  }
  const accounts = [owner];
  for (let index = 1; index < memberCount; index += 1) {
    const member = await registerAccount(request);
    const joined = await request('POST', '/households/join', {
      token: member.token,
      body: { invitationCode: created.body.invitationCode },
    });
    if (joined.status !== 200) throw new Error(`Join failed: ${JSON.stringify(joined.body)}`);
    accounts.push(member);
  }
  const listed = await request('GET', `/households/${created.body.id}`, { token: owner.token });
  return { household: created.body, accounts, roster: listed.body.members };
}
