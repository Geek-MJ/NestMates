import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { clearDatabase, closeDatabase, createSharedHousehold, startTestServer } from './helpers.js';

describe('shared calendar', () => {
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

  it('creates, lists by month, updates and deletes an event', async () => {
    const shared = await createSharedHousehold(server.request, 2);
    const path = `/households/${shared.household.id}/events`;
    const created = await server.request('POST', path, {
      token: shared.accounts[0].token,
      body: { title: 'Dinner', date: '2026-10-18', time: '19:30', description: 'Kitchen' },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.time, '19:30');

    const listed = await server.request('GET', `${path}?month=2026-10`, { token: shared.accounts[1].token });
    assert.equal(listed.body.events.length, 1);
    assert.equal(listed.body.events[0].title, 'Dinner');

    const otherMonth = await server.request('GET', `${path}?month=2026-11`, { token: shared.accounts[0].token });
    assert.deepEqual(otherMonth.body.events, []);

    const updated = await server.request('PUT', `${path}/${created.body.id}`, {
      token: shared.accounts[1].token,
      body: { title: 'Dinner moved', date: '2026-10-19', time: '', description: '' },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.title, 'Dinner moved');
    assert.equal(updated.body.time, null);
    assert.equal(updated.body.description, null);

    const removed = await server.request('DELETE', `${path}/${created.body.id}`, {
      token: shared.accounts[0].token,
    });
    assert.equal(removed.status, 204);
    const afterDelete = await server.request('GET', `${path}?month=2026-10`, { token: shared.accounts[0].token });
    assert.deepEqual(afterDelete.body.events, []);
  });

  it('rejects an impossible date and a missing month', async () => {
    const shared = await createSharedHousehold(server.request);
    const path = `/households/${shared.household.id}/events`;
    const created = await server.request('POST', path, {
      token: shared.accounts[0].token,
      body: { title: 'Nope', date: '2026-02-31' },
    });
    assert.equal(created.status, 400);
    assert.equal(created.body.error.details.fields[0].field, 'date');

    const listed = await server.request('GET', path, { token: shared.accounts[0].token });
    assert.equal(listed.status, 400);
    assert.equal(listed.body.error.details.fields[0].field, 'month');
  });

  it('hides events from other households', async () => {
    const first = await createSharedHousehold(server.request);
    const second = await createSharedHousehold(server.request);
    const created = await server.request('POST', `/households/${first.household.id}/events`, {
      token: first.accounts[0].token,
      body: { title: 'Private', date: '2026-10-03' },
    });
    const read = await server.request('GET', `/households/${first.household.id}/events?month=2026-10`, {
      token: second.accounts[0].token,
    });
    assert.equal(read.status, 403);

    const remove = await server.request('DELETE', `/households/${first.household.id}/events/${created.body.id}`, {
      token: second.accounts[0].token,
    });
    assert.equal(remove.status, 403);
    const still = await server.request('GET', `/households/${first.household.id}/events?month=2026-10`, {
      token: first.accounts[0].token,
    });
    assert.equal(still.body.events.length, 1);
  });
});
