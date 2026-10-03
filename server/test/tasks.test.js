import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { clearDatabase, closeDatabase, createSharedHousehold, registerAccount, startTestServer } from './helpers.js';

describe('shared tasks', () => {
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

  it('creates a task for a member, lists it by due date and marks it done', async () => {
    const shared = await createSharedHousehold(server.request, 2);
    const assignee = shared.roster.find((member) => member.name === shared.accounts[1].name);
    const path = `/households/${shared.household.id}/tasks`;

    const later = await server.request('POST', path, {
      token: shared.accounts[0].token,
      body: { title: 'Bins', assigneeId: assignee.id, dueDate: '2026-10-20' },
    });
    const sooner = await server.request('POST', path, {
      token: shared.accounts[1].token,
      body: { title: 'Kitchen', assigneeId: shared.roster[0].id, dueDate: '2026-10-04' },
    });
    assert.equal(sooner.status, 201);
    assert.equal(sooner.body.status, 'TODO');
    assert.equal(sooner.body.assignee.name, shared.accounts[0].name);

    const listed = await server.request('GET', path, { token: shared.accounts[1].token });
    assert.deepEqual(
      listed.body.tasks.map((task) => task.title),
      ['Kitchen', 'Bins'],
    );

    const done = await server.request('PATCH', `${path}/${sooner.body.id}`, {
      token: shared.accounts[0].token,
      body: { status: 'DONE' },
    });
    assert.equal(done.status, 200);
    assert.equal(done.body.status, 'DONE');
    assert.ok(done.body.completedAt);

    const again = await server.request('PATCH', `${path}/${sooner.body.id}`, {
      token: shared.accounts[1].token,
      body: { status: 'DONE' },
    });
    assert.equal(again.status, 200);
    assert.equal(later.body.title, 'Bins');
  });

  it('rejects an assignee outside the household and a status other than done', async () => {
    const shared = await createSharedHousehold(server.request);
    const outsider = await registerAccount(server.request);
    const profile = await server.request('GET', '/users/me', { token: outsider.token });
    const created = await server.request('POST', `/households/${shared.household.id}/tasks`, {
      token: shared.accounts[0].token,
      body: { title: 'Nope', assigneeId: profile.body.id, dueDate: '2026-10-04' },
    });
    assert.equal(created.status, 400);
    assert.equal(created.body.error.details.fields[0].code, 'NOT_MEMBER');

    const own = await server.request('POST', `/households/${shared.household.id}/tasks`, {
      token: shared.accounts[0].token,
      body: { title: 'Mine', assigneeId: shared.roster[0].id, dueDate: '2026-10-04' },
    });
    const reopened = await server.request('PATCH', `/households/${shared.household.id}/tasks/${own.body.id}`, {
      token: shared.accounts[0].token,
      body: { status: 'TODO' },
    });
    assert.equal(reopened.status, 400);
  });

  it('blocks another household from reading or completing a task', async () => {
    const first = await createSharedHousehold(server.request);
    const second = await createSharedHousehold(server.request);
    const created = await server.request('POST', `/households/${first.household.id}/tasks`, {
      token: first.accounts[0].token,
      body: { title: 'Private', assigneeId: first.roster[0].id, dueDate: '2026-10-04' },
    });
    const read = await server.request('GET', `/households/${first.household.id}/tasks`, {
      token: second.accounts[0].token,
    });
    assert.equal(read.status, 403);
    const update = await server.request('PATCH', `/households/${first.household.id}/tasks/${created.body.id}`, {
      token: second.accounts[0].token,
      body: { status: 'DONE' },
    });
    assert.equal(update.status, 403);
  });
});
