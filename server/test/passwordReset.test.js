import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import User from '../src/models/User.js';
import {
  clearDatabase,
  closeDatabase,
  createRecordingMailer,
  registerAccount,
  startTestServer,
} from './helpers.js';

function tokenFromEmail(message) {
  const link = message.text.match(/https?:\/\/\S+/)[0];
  const url = new URL(link);
  assert.equal(url.origin, 'http://localhost:5173');
  assert.equal(url.pathname, '/reset-password');
  return url.searchParams.get('token');
}

describe('password reset', () => {
  describe('without SMTP configuration', () => {
    let server;

    before(async () => {
      server = await startTestServer();
    });

    after(async () => {
      await clearDatabase();
      await server.close();
    });

    it('reports that email delivery is unavailable instead of pretending to send', async () => {
      const account = await registerAccount(server.request);
      for (const email of [account.email, 'unknown@example.test']) {
        const response = await server.request('POST', '/auth/forgot-password', { body: { email } });
        assert.equal(response.status, 503);
        assert.equal(response.body.error.code, 'SERVICE_UNAVAILABLE');
        assert.equal(response.body.error.details.reason, 'EMAIL_NOT_CONFIGURED');
      }
    });
  });

  describe('with a mail transport', () => {
    let server;
    let mailer;

    before(async () => {
      mailer = createRecordingMailer();
      server = await startTestServer({ mailer });
    });

    beforeEach(async () => {
      await clearDatabase();
      mailer.sent.length = 0;
    });

    after(async () => {
      await clearDatabase();
      await server.close();
      await closeDatabase();
    });

    it('answers the same way for unknown addresses and sends nothing', async () => {
      const response = await server.request('POST', '/auth/forgot-password', {
        body: { email: 'unknown@example.test' },
      });
      assert.equal(response.status, 204);
      assert.equal(mailer.sent.length, 0);
    });

    it('emails a 1-hour link in the user language and stores only a hash of the token', async () => {
      const account = await registerAccount(server.request);
      await User.updateOne({ email: account.email }, { language: 'fr' });

      const response = await server.request('POST', '/auth/forgot-password', {
        body: { email: account.email },
      });
      assert.equal(response.status, 204);
      assert.equal(mailer.sent.length, 1);

      const [message] = mailer.sent;
      assert.equal(message.to[0].address, account.email);
      assert.match(message.subject, /mot de passe/);
      const token = tokenFromEmail(message);

      const stored = await User.findOne({ email: account.email })
        .select('+resetTokenHash +resetTokenExpiresAt')
        .lean();
      assert.match(stored.resetTokenHash, /^[a-f0-9]{64}$/);
      assert.notEqual(stored.resetTokenHash, token);
      const ttl = stored.resetTokenExpiresAt.getTime() - Date.now();
      assert.ok(ttl > 59 * 60 * 1000 && ttl <= 60 * 60 * 1000);
    });

    it('sets the new password once and invalidates the link', async () => {
      const account = await registerAccount(server.request);
      await server.request('POST', '/auth/forgot-password', { body: { email: account.email } });
      const token = tokenFromEmail(mailer.sent[0]);

      const weak = await server.request('POST', '/auth/reset-password', {
        body: { token, password: 'weak' },
      });
      assert.equal(weak.status, 400);
      assert.equal(weak.body.error.details.fields[0].code, 'PASSWORD_RULES');

      const reset = await server.request('POST', '/auth/reset-password', {
        body: { token, password: 'brand new pass 7' },
      });
      assert.equal(reset.status, 204);

      const oldLogin = await server.request('POST', '/auth/login', {
        body: { email: account.email, password: account.password },
      });
      assert.equal(oldLogin.status, 401);
      const newLogin = await server.request('POST', '/auth/login', {
        body: { email: account.email, password: 'brand new pass 7' },
      });
      assert.equal(newLogin.status, 200);

      const reused = await server.request('POST', '/auth/reset-password', {
        body: { token, password: 'another pass 8' },
      });
      assert.equal(reused.status, 400);
      assert.equal(reused.body.error.details.reason, 'INVALID_RESET_TOKEN');
    });

    it('refuses unknown and expired tokens', async () => {
      const unknown = await server.request('POST', '/auth/reset-password', {
        body: { token: 'unknown-token', password: 'brand new pass 7' },
      });
      assert.equal(unknown.status, 400);
      assert.equal(unknown.body.error.details.reason, 'INVALID_RESET_TOKEN');

      const account = await registerAccount(server.request);
      await server.request('POST', '/auth/forgot-password', { body: { email: account.email } });
      const token = tokenFromEmail(mailer.sent[0]);
      await User.updateOne(
        { email: account.email },
        { resetTokenExpiresAt: new Date(Date.now() - 1000) },
      );

      const expired = await server.request('POST', '/auth/reset-password', {
        body: { token, password: 'brand new pass 7' },
      });
      assert.equal(expired.status, 400);
      assert.equal(expired.body.error.details.reason, 'INVALID_RESET_TOKEN');
    });
  });
});
