import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { signAccessToken } from '../src/services/tokenService.js';
import { clearDatabase, closeDatabase, registerAccount, startTestServer } from './helpers.js';

const VALID_PASSWORD = 'correct horse 42';

function fieldCodes(response) {
  return Object.fromEntries(response.body.error.details.fields.map(({ field, code }) => [field, code]));
}

describe('authentication', () => {
  let server;

  before(async () => {
    server = await startTestServer();
  });

  beforeEach(clearDatabase);

  after(async () => {
    await clearDatabase();
    await server.close();
    await closeDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('creates the account and returns a JWT', async () => {
      const response = await server.request('POST', '/auth/register', {
        body: { name: '  Camille  ', email: ' Camille@Example.TEST ', password: VALID_PASSWORD, acceptPrivacy: true },
        headers: { 'Accept-Language': 'fr-FR,fr;q=0.9' },
      });

      assert.equal(response.status, 201);
      assert.deepEqual(Object.keys(response.body), ['token']);
      assert.equal(response.body.token.split('.').length, 3);

      const stored = await User.findOne({ email: 'camille@example.test' }).select('+passwordHash').lean();
      assert.equal(stored.name, 'Camille');
      assert.equal(stored.language, 'fr');
      assert.equal(stored.householdId, null);
      assert.ok(stored.privacyAcceptedAt instanceof Date);
      assert.notEqual(stored.passwordHash, VALID_PASSWORD);
      assert.match(stored.passwordHash, /^\$2b\$12\$/);
    });

    it('defaults to English when the browser language is not French', async () => {
      await server.request('POST', '/auth/register', {
        body: { name: 'Sam', email: 'sam@example.test', password: VALID_PASSWORD, acceptPrivacy: true },
        headers: { 'Accept-Language': 'en-GB,en;q=0.9,fr;q=0.8' },
      });
      const stored = await User.findOne({ email: 'sam@example.test' }).lean();
      assert.equal(stored.language, 'en');
    });

    it('refuses an email address that is already used, regardless of case', async () => {
      await registerAccount(server.request, { email: 'taken@example.test' });
      const response = await server.request('POST', '/auth/register', {
        body: { name: 'Other', email: 'TAKEN@example.test', password: VALID_PASSWORD, acceptPrivacy: true },
      });
      assert.equal(response.status, 409);
      assert.equal(response.body.error.code, 'CONFLICT');
      assert.equal(response.body.error.details.reason, 'EMAIL_TAKEN');
    });

    it('validates every field on the server', async () => {
      const response = await server.request('POST', '/auth/register', {
        body: { name: '   ', email: 'not-an-email', password: 'short', acceptPrivacy: false },
      });
      assert.equal(response.status, 400);
      assert.equal(response.body.error.code, 'VALIDATION_ERROR');
      assert.deepEqual(fieldCodes(response), {
        name: 'REQUIRED',
        email: 'INVALID_EMAIL',
        password: 'PASSWORD_RULES',
        acceptPrivacy: 'MUST_ACCEPT',
      });
      assert.equal(await User.countDocuments(), 0);
    });

    it('requires explicit consent to the privacy policy (FR-ACC-02)', async () => {
      const response = await server.request('POST', '/auth/register', {
        body: { name: 'Lou', email: 'lou@example.test', password: VALID_PASSWORD, acceptPrivacy: 'yes' },
      });
      assert.equal(response.status, 400);
      assert.deepEqual(fieldCodes(response), { acceptPrivacy: 'MUST_ACCEPT' });
    });

    it('rejects non-string values such as MongoDB operators', async () => {
      const response = await server.request('POST', '/auth/register', {
        body: { name: { $gt: '' }, email: { $ne: null }, password: VALID_PASSWORD, acceptPrivacy: true },
      });
      assert.equal(response.status, 400);
      assert.deepEqual(fieldCodes(response), { name: 'INVALID_TYPE', email: 'INVALID_TYPE' });
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns a JWT for valid credentials', async () => {
      const account = await registerAccount(server.request);
      const response = await server.request('POST', '/auth/login', {
        body: { email: account.email.toUpperCase(), password: account.password },
      });
      assert.equal(response.status, 200);
      assert.deepEqual(Object.keys(response.body), ['token']);

      const me = await server.request('GET', '/users/me', { token: response.body.token });
      assert.equal(me.status, 200);
      assert.equal(me.body.email, account.email);
    });

    it('gives the same answer for a wrong password and an unknown email', async () => {
      const account = await registerAccount(server.request);
      const wrongPassword = await server.request('POST', '/auth/login', {
        body: { email: account.email, password: 'wrong password 1' },
      });
      const unknownEmail = await server.request('POST', '/auth/login', {
        body: { email: 'nobody@example.test', password: account.password },
      });

      for (const response of [wrongPassword, unknownEmail]) {
        assert.equal(response.status, 401);
        assert.equal(response.body.error.code, 'UNAUTHENTICATED');
        assert.equal(response.body.error.details.reason, 'INVALID_CREDENTIALS');
      }
      assert.deepEqual(wrongPassword.body, unknownEmail.body);
    });

    it('rejects operator injection in the credentials', async () => {
      await registerAccount(server.request);
      const response = await server.request('POST', '/auth/login', {
        body: { email: { $gt: '' }, password: { $gt: '' } },
      });
      assert.equal(response.status, 400);
      assert.equal(response.body.error.code, 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/users/me', () => {
    it('returns the current user without any secret', async () => {
      const account = await registerAccount(server.request);
      const response = await server.request('GET', '/users/me', { token: account.token });

      assert.equal(response.status, 200);
      assert.deepEqual(Object.keys(response.body).sort(), ['email', 'householdId', 'id', 'language', 'name']);
      assert.equal(response.body.name, account.name);
      assert.equal(response.body.email, account.email);
      assert.equal(response.body.householdId, null);
      assert.match(response.body.id, /^[a-f0-9]{24}$/);
    });

    it('requires a token', async () => {
      const response = await server.request('GET', '/users/me');
      assert.equal(response.status, 401);
      assert.equal(response.body.error.details.reason, 'TOKEN_MISSING');
    });

    it('rejects invalid and expired tokens', async () => {
      const account = await registerAccount(server.request);
      const user = await User.findOne({ email: account.email }).lean();

      const invalid = await server.request('GET', '/users/me', { token: 'not.a.jwt' });
      assert.equal(invalid.status, 401);
      assert.equal(invalid.body.error.details.reason, 'TOKEN_INVALID');

      const forged = signAccessToken(user._id, { secret: 'x'.repeat(40), expiresIn: '1h' });
      const forgedResponse = await server.request('GET', '/users/me', { token: forged });
      assert.equal(forgedResponse.status, 401);

      const expired = signAccessToken(user._id, { ...server.config.jwt, expiresIn: '-1s' });
      const expiredResponse = await server.request('GET', '/users/me', { token: expired });
      assert.equal(expiredResponse.status, 401);
      assert.equal(expiredResponse.body.error.details.reason, 'TOKEN_EXPIRED');
    });

    it('rejects a token whose account no longer exists', async () => {
      const token = signAccessToken(new mongoose.Types.ObjectId(), server.config.jwt);
      const response = await server.request('GET', '/users/me', { token });
      assert.equal(response.status, 401);
      assert.equal(response.body.error.details.reason, 'USER_NOT_FOUND');
    });
  });
});
