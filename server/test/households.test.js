import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import Household from '../src/models/Household.js';
import User from '../src/models/User.js';
import { clearDatabase, closeDatabase, registerAccount, startTestServer } from './helpers.js';

describe('households', () => {
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

  async function createHousehold(token, name = 'Rue Oberkampf') {
    return server.request('POST', '/households', { token, body: { name } });
  }

  describe('POST /api/households', () => {
    it('creates the household and makes the creator its first member', async () => {
      const account = await registerAccount(server.request);
      const response = await createHousehold(account.token, '  Rue Oberkampf  ');

      assert.equal(response.status, 201);
      assert.equal(response.body.name, 'Rue Oberkampf');
      assert.match(response.body.invitationCode, /^[A-HJ-NP-Z2-9]{8}$/);

      const me = await server.request('GET', '/users/me', { token: account.token });
      assert.equal(me.body.householdId, response.body.id);
    });

    it('refuses a second household for a member', async () => {
      const account = await registerAccount(server.request);
      await createHousehold(account.token);
      const response = await createHousehold(account.token, 'Second flat');

      assert.equal(response.status, 409);
      assert.equal(response.body.error.details.reason, 'ALREADY_IN_HOUSEHOLD');
      assert.equal(await Household.countDocuments(), 1);
    });

    it('never gives a user two households under concurrent requests', async () => {
      const account = await registerAccount(server.request);
      const responses = await Promise.all(
        ['One', 'Two', 'Three'].map((name) => createHousehold(account.token, name)),
      );

      assert.equal(responses.filter((response) => response.status === 201).length, 1);
      assert.equal(await Household.countDocuments(), 1);
    });

    it('validates the name and requires authentication', async () => {
      const account = await registerAccount(server.request);
      const invalid = await createHousehold(account.token, '   ');
      assert.equal(invalid.status, 400);
      assert.deepEqual(invalid.body.error.details.fields, [{ field: 'name', code: 'REQUIRED' }]);

      const anonymous = await server.request('POST', '/households', { body: { name: 'Flat' } });
      assert.equal(anonymous.status, 401);
    });
  });

  describe('POST /api/households/join', () => {
    it('adds the user to the household of a valid code, typed loosely', async () => {
      const creator = await registerAccount(server.request);
      const { body: household } = await createHousehold(creator.token);
      const joiner = await registerAccount(server.request);

      const typed = `${household.invitationCode.slice(0, 4).toLowerCase()} ${household.invitationCode.slice(4)}`;
      const response = await server.request('POST', '/households/join', {
        token: joiner.token,
        body: { invitationCode: typed },
      });

      assert.equal(response.status, 200);
      assert.equal(response.body.id, household.id);
      assert.equal(response.body.name, household.name);

      const me = await server.request('GET', '/users/me', { token: joiner.token });
      assert.equal(me.body.householdId, household.id);
    });

    it('answers 404 for a code that matches no household', async () => {
      const account = await registerAccount(server.request);
      const response = await server.request('POST', '/households/join', {
        token: account.token,
        body: { invitationCode: 'ZZZZ9999' },
      });
      assert.equal(response.status, 404);
      assert.equal(response.body.error.details.reason, 'INVALID_INVITATION_CODE');

      const user = await User.findOne({ email: account.email }).lean();
      assert.equal(user.householdId, null);
    });

    it('validates the code format', async () => {
      const account = await registerAccount(server.request);
      const response = await server.request('POST', '/households/join', {
        token: account.token,
        body: { invitationCode: 'ABC' },
      });
      assert.equal(response.status, 400);
      assert.deepEqual(response.body.error.details.fields, [
        { field: 'invitationCode', code: 'INVALID_FORMAT' },
      ]);
    });

    it('refuses a user who already belongs to a household', async () => {
      const first = await registerAccount(server.request);
      const second = await registerAccount(server.request);
      await createHousehold(first.token, 'First');
      const { body: other } = await createHousehold(second.token, 'Second');

      const response = await server.request('POST', '/households/join', {
        token: first.token,
        body: { invitationCode: other.invitationCode },
      });
      assert.equal(response.status, 409);
      assert.equal(response.body.error.details.reason, 'ALREADY_IN_HOUSEHOLD');
    });
  });

  describe('GET /api/households/:id (membership check)', () => {
    it('returns the household, its members and the invitation code to members', async () => {
      const creator = await registerAccount(server.request, { name: 'Alex' });
      const { body: household } = await createHousehold(creator.token);
      const joiner = await registerAccount(server.request, { name: 'Shayan' });
      await server.request('POST', '/households/join', {
        token: joiner.token,
        body: { invitationCode: household.invitationCode },
      });

      const response = await server.request('GET', `/households/${household.id}`, {
        token: joiner.token,
      });
      assert.equal(response.status, 200);
      assert.equal(response.body.invitationCode, household.invitationCode);
      assert.deepEqual(
        response.body.members.map((member) => member.name),
        ['Alex', 'Shayan'],
      );
      assert.deepEqual(Object.keys(response.body.members[0]).sort(), ['id', 'name']);
    });

    it('forbids users from other households and users without a household', async () => {
      const owner = await registerAccount(server.request);
      const { body: household } = await createHousehold(owner.token);
      const outsider = await registerAccount(server.request);
      const otherMember = await registerAccount(server.request);
      await createHousehold(otherMember.token, 'Elsewhere');

      for (const account of [outsider, otherMember]) {
        const response = await server.request('GET', `/households/${household.id}`, {
          token: account.token,
        });
        assert.equal(response.status, 403);
        assert.equal(response.body.error.code, 'FORBIDDEN');
        assert.equal(response.body.error.details.reason, 'NOT_HOUSEHOLD_MEMBER');
      }
    });

    it('forbids malformed and unknown household ids and requires authentication', async () => {
      const account = await registerAccount(server.request);
      for (const id of ['not-an-id', String(new mongoose.Types.ObjectId())]) {
        const response = await server.request('GET', `/households/${id}`, { token: account.token });
        assert.equal(response.status, 403);
      }

      const anonymous = await server.request('GET', `/households/${new mongoose.Types.ObjectId()}`);
      assert.equal(anonymous.status, 401);
    });
  });
});
