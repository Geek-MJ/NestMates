import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import Household from '../src/models/Household.js';
import User from '../src/models/User.js';
import { clearDatabase, closeDatabase, registerAccount, startTestServer } from './helpers.js';

describe('profile', () => {
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

  function patchMe(token, body) {
    return server.request('PATCH', '/users/me', { token, body });
  }

  describe('PATCH /api/users/me', () => {
    it('updates the name and returns the safe user', async () => {
      const account = await registerAccount(server.request, { name: 'Alex' });
      const response = await patchMe(account.token, { name: '  Camille  ' });

      assert.equal(response.status, 200);
      assert.equal(response.body.name, 'Camille');
      assert.equal(response.body.email, account.email);
      assert.equal(response.body.language, 'en');
      assert.equal(response.body.householdId, null);
      assert.deepEqual(Object.keys(response.body).sort(), ['email', 'householdId', 'id', 'language', 'name']);

      const stored = await User.findOne({ email: account.email }).select('+passwordHash +resetTokenHash').lean();
      assert.equal(stored.name, 'Camille');
      assert.equal(stored.passwordHash.startsWith('$2'), true);
      assert.equal(Object.hasOwn(response.body, 'passwordHash'), false);
      assert.equal(Object.hasOwn(response.body, 'resetTokenHash'), false);
    });

    it('updates the language and keeps it for the next session read', async () => {
      const account = await registerAccount(server.request);
      const response = await patchMe(account.token, { language: 'fr' });

      assert.equal(response.status, 200);
      assert.equal(response.body.language, 'fr');

      const again = await server.request('GET', '/users/me', { token: account.token });
      assert.equal(again.body.language, 'fr');
    });

    it('updates the email when it is unique and rejects one already in use', async () => {
      const account = await registerAccount(server.request);
      const other = await registerAccount(server.request);

      const taken = await patchMe(account.token, { email: other.email.toUpperCase() });
      assert.equal(taken.status, 409);
      assert.equal(taken.body.error.code, 'CONFLICT');
      assert.equal(taken.body.error.details.reason, 'EMAIL_TAKEN');

      const nextEmail = `renamed.${Date.now()}@test.invalid`;
      const updated = await patchMe(account.token, { email: nextEmail });
      assert.equal(updated.status, 200);
      assert.equal(updated.body.email, nextEmail);

      const oldLogin = await server.request('POST', '/auth/login', {
        body: { email: account.email, password: account.password },
      });
      assert.equal(oldLogin.status, 401);

      const newLogin = await server.request('POST', '/auth/login', {
        body: { email: nextEmail, password: account.password },
      });
      assert.equal(newLogin.status, 200);
    });

    it('rejects an invalid name, email or language and ignores membership fields', async () => {
      const account = await registerAccount(server.request, { name: 'Alex' });
      const before = await server.request('GET', '/users/me', { token: account.token });

      const cases = [
        [{ name: '   ' }, { field: 'name', code: 'REQUIRED' }],
        [{ name: 'a'.repeat(101) }, { field: 'name', code: 'TOO_LONG' }],
        [{ name: { $gt: '' } }, { field: 'name', code: 'INVALID_TYPE' }],
        [{ email: 'not-an-email' }, { field: 'email', code: 'INVALID_EMAIL' }],
        [{ language: 'de' }, { field: 'language', code: 'INVALID_FORMAT' }],
        [{ language: 'EN' }, { field: 'language', code: 'INVALID_FORMAT' }],
        [{ language: '' }, { field: 'language', code: 'REQUIRED' }],
        [{}, { field: 'body', code: 'REQUIRED' }],
      ];

      for (const [body, fieldError] of cases) {
        const response = await patchMe(account.token, body);
        assert.equal(response.status, 400, JSON.stringify(body));
        assert.equal(response.body.error.code, 'VALIDATION_ERROR');
        assert.deepEqual(response.body.error.details.fields, [fieldError]);
      }

      const injected = await patchMe(account.token, {
        name: 'Alex',
        householdId: '507f1f77bcf86cd799439011',
        passwordHash: 'plaintext',
      });
      assert.equal(injected.status, 200);
      assert.equal(injected.body.householdId, null);
      assert.equal(injected.body.name, 'Alex');

      const after = await server.request('GET', '/users/me', { token: account.token });
      assert.equal(after.body.language, before.body.language);
      assert.equal(after.body.email, before.body.email);
    });

    it('requires authentication', async () => {
      const response = await server.request('PATCH', '/users/me', { body: { name: 'Alex' } });
      assert.equal(response.status, 401);
    });
  });

  describe('PUT /api/users/me/password', () => {
    it('replaces the password, keeps the current session and never returns the hash', async () => {
      const account = await registerAccount(server.request);
      const before = await User.findOne({ email: account.email }).select('+passwordHash').lean();

      const response = await server.request('PUT', '/users/me/password', {
        token: account.token,
        body: { currentPassword: account.password, newPassword: 'brand new 7' },
      });
      assert.equal(response.status, 204);
      assert.equal(response.body, null);

      const after = await User.findOne({ email: account.email }).select('+passwordHash').lean();
      assert.notEqual(after.passwordHash, before.passwordHash);
      assert.match(after.passwordHash, /^\$2b\$12\$/);
      assert.notEqual(after.passwordHash, 'brand new 7');

      const stillSignedIn = await server.request('GET', '/users/me', { token: account.token });
      assert.equal(stillSignedIn.status, 200);

      const oldPassword = await server.request('POST', '/auth/login', {
        body: { email: account.email, password: account.password },
      });
      assert.equal(oldPassword.status, 401);

      const newPassword = await server.request('POST', '/auth/login', {
        body: { email: account.email, password: 'brand new 7' },
      });
      assert.equal(newPassword.status, 200);
    });

    it('rejects a wrong current password and an invalid new password', async () => {
      const account = await registerAccount(server.request);
      const before = await User.findOne({ email: account.email }).select('+passwordHash').lean();

      const wrong = await server.request('PUT', '/users/me/password', {
        token: account.token,
        body: { currentPassword: 'not the password 1', newPassword: 'brand new 7' },
      });
      assert.equal(wrong.status, 400);
      assert.equal(wrong.body.error.code, 'VALIDATION_ERROR');
      assert.equal(wrong.body.error.details.reason, 'CURRENT_PASSWORD_INCORRECT');

      const weak = await server.request('PUT', '/users/me/password', {
        token: account.token,
        body: { currentPassword: account.password, newPassword: 'no-digits' },
      });
      assert.equal(weak.status, 400);
      assert.deepEqual(weak.body.error.details.fields, [{ field: 'newPassword', code: 'PASSWORD_RULES' }]);

      const after = await User.findOne({ email: account.email }).select('+passwordHash').lean();
      assert.equal(after.passwordHash, before.passwordHash);
    });

    it('requires authentication', async () => {
      const response = await server.request('PUT', '/users/me/password', {
        body: { currentPassword: 'correct horse 42', newPassword: 'brand new 7' },
      });
      assert.equal(response.status, 401);
    });
  });

  describe('DELETE /api/users/me', () => {
    it('deletes an account that belongs to no household', async () => {
      const account = await registerAccount(server.request);
      const response = await server.request('DELETE', '/users/me', { token: account.token });

      assert.equal(response.status, 204);
      assert.equal(response.body, null);
      assert.equal(await User.countDocuments({ email: account.email }), 0);

      const again = await server.request('GET', '/users/me', { token: account.token });
      assert.equal(again.status, 401);
      assert.equal(again.body.error.details.reason, 'USER_NOT_FOUND');
    });

    it('refuses to delete an account that still belongs to a household', async () => {
      const account = await registerAccount(server.request);
      const created = await server.request('POST', '/households', {
        token: account.token,
        body: { name: 'Rue Oberkampf' },
      });
      assert.equal(created.status, 201);

      const response = await server.request('DELETE', '/users/me', { token: account.token });
      assert.equal(response.status, 409);
      assert.equal(response.body.error.code, 'CONFLICT');
      assert.equal(response.body.error.details.reason, 'ACCOUNT_IN_HOUSEHOLD');

      assert.equal(await User.countDocuments({ email: account.email }), 1);
      assert.equal(await Household.countDocuments({ _id: created.body.id }), 1);

      const me = await server.request('GET', '/users/me', { token: account.token });
      assert.equal(me.body.householdId, created.body.id);
    });

    it('requires authentication', async () => {
      const response = await server.request('DELETE', '/users/me');
      assert.equal(response.status, 401);
    });
  });
});
