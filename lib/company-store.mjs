/** Shared company operations for local SQLite and hosted Supabase. */
export function companyStore(database) {
  if (database.kind === 'supabase') return database;
  return {
    async seed(companies) {
      if (await database.prepare("SELECT value FROM settings WHERE key = 'workbook-import-v1'").first()) return;
      await database.batch([
        ...companies.map(c => database.prepare('INSERT OR IGNORE INTO companies (id, data, updated_at) VALUES (?, ?, ?)').bind(c.id, JSON.stringify(c), c.updatedAt || '')),
        database.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('workbook-import-v1', 'complete')"),
      ]);
    },
    async list() { return (await database.prepare('SELECT data FROM companies ORDER BY rowid').all()).results.map(row => JSON.parse(row.data)); },
    async get(id) { const row = await database.prepare('SELECT data FROM companies WHERE id = ?').bind(id).first(); return row ? JSON.parse(row.data) : null; },
    async create(company) { await database.prepare('INSERT INTO companies (id, data, updated_at) VALUES (?, ?, ?)').bind(company.id, JSON.stringify(company), company.updatedAt).run(); },
    async update(company) { await database.prepare('UPDATE companies SET data = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(company), company.updatedAt, company.id).run(); },
  };
}
