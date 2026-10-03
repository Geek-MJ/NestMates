import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { MAX_FILE_BYTES } from '../src/modules/documents/files.js';
import { clearDatabase, closeDatabase, createSharedHousehold, startTestServer } from './helpers.js';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const PDF = Buffer.from('%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

async function sendFile(server, token, householdId, { bytes, type, name }) {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type }), name);
  const response = await fetch(`${server.baseUrl}/api/households/${householdId}/documents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

describe('shared documents', () => {
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

  it('stores a file in GridFS and lets a member download it', async () => {
    const shared = await createSharedHousehold(server.request, 2);
    const uploaded = await sendFile(server, shared.accounts[0].token, shared.household.id, {
      bytes: PNG,
      type: 'image/png',
      name: '../lease.png',
    });
    assert.equal(uploaded.status, 201);
    assert.equal(uploaded.body.fileName, 'lease.png');
    assert.equal(uploaded.body.mimeType, 'image/png');
    assert.equal(uploaded.body.size, PNG.length);
    assert.equal(uploaded.body.uploadedBy.id, shared.roster[0].id);
    assert.equal(uploaded.body.gridFsFileId, undefined);

    const listed = await server.request('GET', `/households/${shared.household.id}/documents`, {
      token: shared.accounts[1].token,
    });
    assert.equal(listed.body.total, 1);

    const content = await fetch(
      `${server.baseUrl}/api/households/${shared.household.id}/documents/${uploaded.body.id}/content`,
      { headers: { Authorization: `Bearer ${shared.accounts[1].token}` } },
    );
    assert.equal(content.status, 200);
    assert.equal(content.headers.get('content-type'), 'image/png');
    assert.match(content.headers.get('content-disposition'), /inline/);
    assert.equal(content.headers.get('x-content-type-options'), 'nosniff');
    assert.deepEqual(Buffer.from(await content.arrayBuffer()), PNG);

    const download = await fetch(
      `${server.baseUrl}/api/households/${shared.household.id}/documents/${uploaded.body.id}/content?disposition=attachment`,
      { headers: { Authorization: `Bearer ${shared.accounts[0].token}` } },
    );
    assert.match(download.headers.get('content-disposition'), /attachment/);
  });

  it('rejects a missing file, a text file and a file over 10 MB', async () => {
    const shared = await createSharedHousehold(server.request);
    const path = `/households/${shared.household.id}/documents`;
    const missing = await server.request('POST', path, { token: shared.accounts[0].token });
    assert.equal(missing.status, 400);

    const text = await sendFile(server, shared.accounts[0].token, shared.household.id, {
      bytes: Buffer.from('hello'),
      type: 'text/plain',
      name: 'notes.txt',
    });
    assert.equal(text.status, 415);
    assert.equal(text.body.error.code, 'UNSUPPORTED_MEDIA_TYPE');

    const disguised = await sendFile(server, shared.accounts[0].token, shared.household.id, {
      bytes: Buffer.from('not really a png'),
      type: 'image/png',
      name: 'fake.png',
    });
    assert.equal(disguised.status, 415);

    const oversized = Buffer.alloc(MAX_FILE_BYTES + 1, 0);
    PNG.copy(oversized);
    const huge = await sendFile(server, shared.accounts[0].token, shared.household.id, {
      bytes: oversized,
      type: 'image/png',
      name: 'huge.png',
    });
    assert.equal(huge.status, 413);
    assert.equal(huge.body.error.details.reason, 'FILE_TOO_LARGE');
  });

  it('lets any member delete a document and blocks other households', async () => {
    const first = await createSharedHousehold(server.request, 2);
    const second = await createSharedHousehold(server.request);
    const uploaded = await sendFile(server, first.accounts[0].token, first.household.id, {
      bytes: PDF,
      type: 'application/pdf',
      name: 'lease.pdf',
    });

    const outsider = await fetch(
      `${server.baseUrl}/api/households/${first.household.id}/documents/${uploaded.body.id}/content`,
      { headers: { Authorization: `Bearer ${second.accounts[0].token}` } },
    );
    assert.equal(outsider.status, 403);

    const anonymous = await fetch(
      `${server.baseUrl}/api/households/${first.household.id}/documents/${uploaded.body.id}/content`,
    );
    assert.equal(anonymous.status, 401);

    const removed = await server.request(
      'DELETE',
      `/households/${first.household.id}/documents/${uploaded.body.id}`,
      { token: first.accounts[1].token },
    );
    assert.equal(removed.status, 204);

    const gone = await fetch(
      `${server.baseUrl}/api/households/${first.household.id}/documents/${uploaded.body.id}/content`,
      { headers: { Authorization: `Bearer ${first.accounts[0].token}` } },
    );
    assert.equal(gone.status, 404);
  });
});
