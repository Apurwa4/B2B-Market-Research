import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDatabase } from '../lib/database.mjs';
import { handleApi } from '../lib/company-api.mjs';

function request(path = '', method = 'GET', body) {
  return new Request('http://localhost:3100/api/companies' + path, {
    method,
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3100' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test('local database preserves edits after closing and reopening the connection', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'igt-local-db-'));
  const filename = join(directory, 'research.sqlite');
  let db = createDatabase(filename);
  try {
    const response = await handleApi(request(), { DB: db });
    const { companies } = await response.json();
    assert.equal(companies.length, 46);
    const edited = { ...companies[0], notes: 'Saved by the local Next.js backend', contacted: true };
    const saved = await handleApi(request('/' + edited.id, 'PUT', edited), { DB: db });
    assert.equal(saved.status, 200);
    db.close();
    db = createDatabase(filename);
    const reread = await handleApi(request('/' + edited.id), { DB: db });
    const { company } = await reread.json();
    assert.equal(company.notes, edited.notes);
    assert.equal(company.contacted, true);
    const all = await handleApi(request(), { DB: db });
    assert.equal((await all.json()).companies.length, 46);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('failed batches roll back every write', () => {
  const db = createDatabase(':memory:');
  try {
    assert.throws(() => db.batch([
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').bind('rollback-test', 'must not persist'),
      db.prepare('INSERT INTO missing_table (id) VALUES (?)').bind('fail'),
    ]));
    assert.equal(db.prepare("SELECT value FROM settings WHERE key = 'rollback-test'").first(), undefined);
  } finally { db.close(); }
});
