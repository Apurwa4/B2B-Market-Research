import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { createSupabaseStore } from '../lib/supabase-store.mjs';

const apply = process.argv.includes('--apply');
const filename = resolve(process.env.MARKET_RESEARCH_DATABASE_PATH || '.local/market-research.sqlite');
const source = new DatabaseSync(filename, { readOnly: true });
let records;
try { records = source.prepare('SELECT data FROM companies ORDER BY rowid').all().map(row => JSON.parse(row.data)); }
finally { source.close(); }
console.log(`Found ${records.length} local company records, including saved edits.`);
if (!apply) {
  console.log('Dry run. No remote changes made. Use npm run db:transfer -- --apply after configuring Supabase and applying the schema.');
} else {
  const store = createSupabaseStore(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
  const existing = await store.list();
  if (existing.length) throw new Error('Hosted database already contains records. Stopping to preserve them; review existing records before transferring.');
  await store.seed(records);
  const remote = await store.list();
  const normalize = value => JSON.stringify(Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([key,value]) => [key, value && typeof value === 'object' ? normalize(value) : value]));
  const byId = new Map(remote.map(company => [company.id, normalize(company)]));
  if (records.length !== remote.length || records.some(company => byId.get(company.id) !== normalize(company))) throw new Error('Transfer verification failed. Review the hosted records before deployment.');
  console.log(`Transferred and verified all ${remote.length} company records. Local database is unchanged.`);
}
