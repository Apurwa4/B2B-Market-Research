import workbook from '../data/workbook.json' with { type: 'json' };

const maxBodyBytes = 65536;
const textFields = { name: 300, team: 100, member: 200, product: 20, industry: 200, phone: 200, contactPerson: 200, address: 2000, website: 2000, social: 2000, source: 2000, pitch: 10000, notes: 10000, followUp: 10, outcome: 300 };
const boolFields = ['crm', 'contacted', 'bookletSent'];
export function validateCompany(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('A company object is required.');
  const company = {};
  for (const [key, maxLength] of Object.entries(textFields)) {
    if (body[key] !== undefined && typeof body[key] !== 'string') throw new Error(`${key} must be text.`);
    company[key] = (body[key] ?? '').trim();
    if (company[key].length > maxLength) throw new Error(`${key} is too long.`);
  }
  if (!company.name) throw new Error('Please enter a company name.');
  if (!workbook.teams.includes(company.team)) throw new Error('Please select a valid team.');
  if (!['GTe', 'GTa'].includes(company.product)) throw new Error('Please select GTe or GTa.');
  if (company.followUp && (!/^\d{4}-\d{2}-\d{2}$/.test(company.followUp) || Number.isNaN(Date.parse(company.followUp)) || new Date(company.followUp).toISOString().slice(0,10) !== company.followUp)) throw new Error('Please enter a valid follow-up date.');
  for (const field of ['website','social']) {
    if (company[field]) {
      try { const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(company[field]) ? company[field] : 'https://' + company[field]); if (!['https:','http:'].includes(u.protocol)) throw new Error(); company[field] = u.href; } catch { throw new Error(`Please enter a valid http or https ${field === 'social' ? 'social media URL' : 'website URL'}.`); }
    }
  }
  for (const field of boolFields) { if (typeof body[field] !== 'boolean') throw new Error(`${field} must be true or false.`); company[field] = body[field]; }
  return company;
}
function json(value, status = 200) { return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
export async function seed(db) {
  const done = await db.prepare("SELECT value FROM settings WHERE key = 'workbook-import-v1'").first();
  if (done) return;
  // Inserts and the import marker commit atomically; concurrent first visits cannot duplicate data.
  await db.batch([
    ...workbook.companies.map(c => db.prepare('INSERT OR IGNORE INTO companies (id, data, updated_at) VALUES (?, ?, ?)').bind(c.id, JSON.stringify(c), '')),
    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('workbook-import-v1', 'complete')")
  ]);
}
async function readBody(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('Use application/json.');
  if (Number(request.headers.get('content-length')) > maxBodyBytes) throw new Error('The record is too large.');
  const reader = request.body?.getReader(); if (!reader) throw new Error('A company object is required.');
  const chunks=[];let size=0;
  while(true) { const {done,value} = await reader.read();if(done)break;size+=value.byteLength;if(size>maxBodyBytes){await reader.cancel();throw new Error('The record is too large.');} chunks.push(value); }
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new Error('Invalid JSON.');}
}
export async function handleApi(request, env) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/companies(?:\/([^/]+))?\/?$/);
  if (!match) return json({ error: 'Not found.' }, 404);
  // The development server binds to loopback. Reject cross-origin writes as well.
  if (!['GET','POST','PUT'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405);
  if (request.method !== 'GET') {
    const origin = request.headers.get('Origin');
    if ((origin && origin !== url.origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({ error: 'Cross-origin writes are not allowed.' }, 403);
  }
  if (!env.DB) return json({ error: 'Database is not configured.' }, 503);
  try {
    await seed(env.DB);
    let id;
    try { id = match[1] ? decodeURIComponent(match[1]) : undefined; } catch { return json({error:'Invalid company ID.'},400); }
    if (request.method === 'GET') {
      if(id) { const row = await env.DB.prepare('SELECT data FROM companies WHERE id = ?').bind(id).first();return row ? json({company:JSON.parse(row.data)}) : json({error:'Company not found.'},404); }
      const result = await env.DB.prepare('SELECT data FROM companies ORDER BY rowid').all();
      return json({ companies: result.results.map(row => JSON.parse(row.data)) });
    }
    if (request.method === 'POST' && id) return json({error:'Create companies at /api/companies.'},405);
    if (request.method === 'PUT' && !id) return json({error:'A company ID is required.'},400);
    let input;
    try { input = validateCompany(await readBody(request)); } catch (error) { return json({error:error.message},400); }
    let previous;
    if (id) {
      const row = await env.DB.prepare('SELECT data FROM companies WHERE id = ?').bind(id).first();
      if(!row)return json({error:'Company not found.'},404);
      previous = JSON.parse(row.data);
    }
    const company = { ...previous, ...input, id: id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
    if(id)await env.DB.prepare('UPDATE companies SET data = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(company),company.updatedAt,company.id).run();
    else await env.DB.prepare('INSERT INTO companies (id, data, updated_at) VALUES (?, ?, ?)').bind(company.id,JSON.stringify(company),company.updatedAt).run();
    return json({company}, id ? 200 : 201);
  } catch (error) { console.error('Database request failed', error); return json({error:'The database is temporarily unavailable. Please try again.'},503); }
}
