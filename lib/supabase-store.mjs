import { createClient } from '@supabase/supabase-js';

export function createSupabaseStore(url, key) {
  if (!url || !key) throw new Error('Supabase URL and server secret key are required.');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  function checked(result) { if (result.error) throw new Error(`Database operation failed: ${result.error.code || 'unknown error'}`); return result.data; }
  return {
    kind: 'supabase',
    async seed(companies) { checked(await client.rpc('seed_research_companies', { initial_companies: companies })); },
    async list() { return checked(await client.from('research_companies').select('data').order('position', { ascending: true })).map(row => row.data); },
    async get(id) { return checked(await client.from('research_companies').select('data').eq('id', id).maybeSingle())?.data || null; },
    async create(company) { checked(await client.from('research_companies').insert({ id: company.id, data: company, updated_at: company.updatedAt })); },
    async update(company) {
      const row = checked(await client.from('research_companies').update({ data: company, updated_at: company.updatedAt }).eq('id', company.id).select('id').maybeSingle());
      if (!row) throw new Error('The company no longer exists.');
    },
  };
}
