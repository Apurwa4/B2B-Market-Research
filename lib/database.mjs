import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/** Local SQLite storage. Kept out of Git and reused during Next.js HMR. */
export function createDatabase(filename) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const sqlite = new DatabaseSync(filename);
  sqlite.exec('PRAGMA busy_timeout = 5000;');
  if (filename !== ':memory:') sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  function prepare(sql, args = []) {
    return {
      sql, args,
      bind(...values) { return prepare(sql, values); },
      first() { return sqlite.prepare(sql).get(...args); },
      all() { return { results: sqlite.prepare(sql).all(...args) }; },
      run() { return sqlite.prepare(sql).run(...args); },
    };
  }

  return {
    prepare,
    batch(statements) {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const results = statements.map(statement => statement.run());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
    close() { sqlite.close(); },
  };
}

export function getDatabase() {
  if (process.env.VERCEL) {
    throw new Error('Configure a hosted database before deploying to Vercel. Local SQLite is for development only.');
  }
  const filename = resolve(/*turbopackIgnore: true*/ process.env.MARKET_RESEARCH_DATABASE_PATH || '.local/market-research.sqlite');
  if (!globalThis.__igtLocalDatabase) globalThis.__igtLocalDatabase = createDatabase(filename);
  return globalThis.__igtLocalDatabase;
}
