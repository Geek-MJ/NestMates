import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { clearDatabase, closeDatabase, createSharedHousehold, registerAccount, startTestServer } from './helpers.js';

describe('shared expenses', () => {
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

  async function householdOf(count) {
    const shared = await createSharedHousehold(server.request, count);
    const idOf = (account) => shared.roster.find((member) => member.name === account.name).id;
    return { ...shared, idOf };
  }

  function expenseBody(shared, { payer, participants, amountCents = 1000, ...rest } = {}) {
    return {
      amountCents,
      payerId: shared.idOf(payer ?? shared.accounts[0]),
      participantIds: (participants ?? shared.accounts).map((account) => shared.idOf(account)),
      date: '2026-10-03',
      category: 'groceries',
      description: 'Market',
      ...rest,
    };
  }

  it('splits an expense equally, lists it and computes who owes whom', async () => {
    const shared = await householdOf(3);
    const [alex, sam, noa] = shared.accounts;
    const created = await server.request('POST', `/households/${shared.household.id}/expenses`, {
      token: alex.token,
      body: expenseBody(shared),
    });

    assert.equal(created.status, 201);
    assert.equal(created.body.expense.amountCents, 1000);
    const shares = Object.fromEntries(
      created.body.expense.shares.map((share) => [share.user.id, share.amountCents]),
    );
    assert.equal(shares[shared.idOf(alex)] + shares[shared.idOf(sam)] + shares[shared.idOf(noa)], 1000);

    const debts = created.body.debts;
    assert.equal(debts.balances.find((item) => item.member.id === shared.idOf(alex)).amountCents, 666);
    assert.equal(debts.debts.length, 2);
    assert.ok(debts.debts.every((debt) => debt.to.id === shared.idOf(alex)));

    const history = await server.request('GET', `/households/${shared.household.id}/expenses`, {
      token: sam.token,
    });
    assert.equal(history.status, 200);
    assert.equal(history.body.total, 1);
    assert.equal(history.body.items[0].description, 'Market');
    assert.equal(history.body.pageSize, 50);
  });

  it('rejects an invalid amount, a bad category and someone from another household', async () => {
    const shared = await householdOf(2);
    const outsider = await registerAccount(server.request);
    const path = `/households/${shared.household.id}/expenses`;

    const amount = await server.request('POST', path, {
      token: shared.accounts[0].token,
      body: expenseBody(shared, { amountCents: 12.5 }),
    });
    assert.equal(amount.status, 400);
    assert.equal(amount.body.error.code, 'VALIDATION_ERROR');

    const category = await server.request('POST', path, {
      token: shared.accounts[0].token,
      body: expenseBody(shared, { category: 'spaceship' }),
    });
    assert.equal(category.status, 400);

    const me = await server.request('GET', '/users/me', { token: outsider.token });
    const rejected = await server.request('POST', path, {
      token: shared.accounts[0].token,
      body: {
        ...expenseBody(shared),
        participantIds: [shared.idOf(shared.accounts[0]), me.body.id],
      },
    });
    assert.equal(rejected.status, 400);
    assert.equal(rejected.body.error.details.fields[0].code, 'NOT_MEMBER');
  });

  it('settles the full current debt and then reports a zero balance', async () => {
    const shared = await householdOf(2);
    const [payer, debtor] = shared.accounts;
    await server.request('POST', `/households/${shared.household.id}/expenses`, {
      token: payer.token,
      body: expenseBody(shared, { payer, amountCents: 800 }),
    });

    const settled = await server.request('POST', `/households/${shared.household.id}/settlements`, {
      token: debtor.token,
      body: { counterpartId: shared.idOf(payer), amountCents: 1 },
    });
    assert.equal(settled.status, 201);
    assert.equal(settled.body.settlement.amountCents, 400);
    assert.equal(settled.body.settlement.from.id, shared.idOf(debtor));
    assert.equal(settled.body.settlement.to.id, shared.idOf(payer));
    assert.deepEqual(settled.body.debts.debts, []);

    const history = await server.request('GET', `/households/${shared.household.id}/settlements`, {
      token: payer.token,
    });
    assert.equal(history.body.total, 1);

    const again = await server.request('POST', `/households/${shared.household.id}/settlements`, {
      token: payer.token,
      body: { counterpartId: shared.idOf(debtor) },
    });
    assert.equal(again.status, 409);
    assert.equal(again.body.error.details.reason, 'NO_DEBT');
  });

  it('paginates the expense history from the newest', async () => {
    const shared = await householdOf(1);
    const path = `/households/${shared.household.id}/expenses`;
    for (let index = 0; index < 51; index += 1) {
      const created = await server.request('POST', path, {
        token: shared.accounts[0].token,
        body: expenseBody(shared, { amountCents: 100 + index, description: `item ${index}` }),
      });
      assert.equal(created.status, 201);
    }

    const first = await server.request('GET', `${path}?page=1`, { token: shared.accounts[0].token });
    const second = await server.request('GET', `${path}?page=2`, { token: shared.accounts[0].token });
    assert.equal(first.body.items.length, 50);
    assert.equal(first.body.total, 51);
    assert.equal(first.body.items[0].description, 'item 50');
    assert.equal(second.body.items.length, 1);
    assert.equal(second.body.items[0].description, 'item 0');
  });

  it('refuses another household and an anonymous request', async () => {
    const first = await householdOf(1);
    const second = await householdOf(1);
    const path = `/households/${first.household.id}/expenses`;

    const outsider = await server.request('GET', path, { token: second.accounts[0].token });
    assert.equal(outsider.status, 403);
    assert.equal(outsider.body.error.details.reason, 'NOT_HOUSEHOLD_MEMBER');

    const anonymous = await server.request('GET', `/households/${first.household.id}/debts`);
    assert.equal(anonymous.status, 401);

    const post = await server.request('POST', path, {
      token: second.accounts[0].token,
      body: expenseBody(first),
    });
    assert.equal(post.status, 403);
  });

  it('refuses to leave while the balance is not settled, then allows it', async () => {
    const shared = await householdOf(2);
    const [payer, debtor] = shared.accounts;
    await server.request('POST', `/households/${shared.household.id}/expenses`, {
      token: payer.token,
      body: expenseBody(shared, { amountCents: 500 }),
    });

    const blocked = await server.request('POST', `/households/${shared.household.id}/leave`, {
      token: debtor.token,
    });
    assert.equal(blocked.status, 409);
    assert.equal(blocked.body.error.details.reason, 'DEBTS_NOT_SETTLED');
    assert.ok(blocked.body.error.details.debts.length > 0);

    const creditorBlocked = await server.request('POST', `/households/${shared.household.id}/leave`, {
      token: payer.token,
    });
    assert.equal(creditorBlocked.status, 409);

    await server.request('POST', `/households/${shared.household.id}/settlements`, {
      token: debtor.token,
      body: { counterpartId: shared.idOf(payer) },
    });

    const left = await server.request('POST', `/households/${shared.household.id}/leave`, {
      token: debtor.token,
    });
    assert.equal(left.status, 204);
    const me = await server.request('GET', '/users/me', { token: debtor.token });
    assert.equal(me.body.householdId, null);

    const stillThere = await server.request('GET', `/households/${shared.household.id}/expenses`, {
      token: payer.token,
    });
    assert.equal(stillThere.status, 200);
    assert.equal(stillThere.body.total, 1);
  });

  it('deletes the household and its records when the last member leaves', async () => {
    const shared = await householdOf(1);
    await server.request('POST', `/households/${shared.household.id}/expenses`, {
      token: shared.accounts[0].token,
      body: expenseBody(shared, { amountCents: 250 }),
    });
    const left = await server.request('POST', `/households/${shared.household.id}/leave`, {
      token: shared.accounts[0].token,
    });
    assert.equal(left.status, 204);

    const gone = await server.request('GET', `/households/${shared.household.id}`, {
      token: shared.accounts[0].token,
    });
    assert.equal(gone.status, 403);
  });
});
