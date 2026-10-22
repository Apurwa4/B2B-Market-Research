import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { handleApi, validateCompany, seed } from '../lib/company-api.mjs';
import workbook from '../data/workbook.json' with { type: 'json' };

function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('CREATE TABLE companies (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL); CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);');
  function statement(sql, args = []) {
    return { bind(...values) { return statement(sql, values); }, async first() { return sqlite.prepare(sql).get(...args); }, async all() { return {results:sqlite.prepare(sql).all(...args)}; }, async run() { return sqlite.prepare(sql).run(...args); } };
  }
  return { prepare: statement, async batch(queries) { sqlite.exec('BEGIN');try{const values=[];for(const query of queries) values.push(await query.run());sqlite.exec('COMMIT');return values;}catch(error){sqlite.exec('ROLLBACK');throw error;} }, close:()=>sqlite.close() };
}
const valid = () => ({...workbook.companies[0]});
function request(path='', method='GET', body, headers={}) { return new Request('https://example.com/api/companies'+path,{method,headers:{'Content-Type':'application/json',...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})}); }

test('imports exactly the named companies from visible tabs and all Home links',()=>{
  assert.equal(workbook.companies.length,46);
  assert.deepEqual(workbook.importInfo.counts,{'Team Ashmitha':10,Apurwa:7,'Team Avidu':13,'Team Thaniya':16});
  assert.equal(workbook.resources.length,13);assert.equal(workbook.steps.length,7);
  assert.ok(workbook.companies.every(c=>workbook.teams.includes(c.team)&&c.name));
  assert.equal(new Set(workbook.companies.map(c=>c.id)).size,46);
});
test('database seed runs once and preserves subsequent edits',async()=>{
 const db=database();try{await seed(db);let c=valid();c.notes='saved note';await db.prepare('UPDATE companies SET data=? WHERE id=?').bind(JSON.stringify(c),c.id).run();await seed(db);assert.equal((await db.prepare('SELECT id FROM companies').all()).results.length,46);assert.equal(JSON.parse((await db.prepare('SELECT data FROM companies WHERE id=?').bind(c.id).first()).data).notes,'saved note');}finally{db.close();}
});
test('read, create, edit, and read persist through independent API requests',async()=>{
 const DB=database();try{
  const response=await handleApi(request(),{DB});assert.equal(response.status,200);assert.equal((await response.json()).companies.length,46);
  const newCompany={...valid(),id:'',name:'Integration test company',notes:'Call next week'};
  const created=await handleApi(request('','POST',newCompany),{DB});assert.equal(created.status,201);const {company}=await created.json();assert.ok(company.id);assert.notEqual(company.id,valid().id);
  const updated=await handleApi(request('/'+company.id,'PUT',{...company,crm:true,contacted:true,notes:'Proposal requested',followUp:'2026-11-10'}),{DB});assert.equal(updated.status,200);
  const reread=await handleApi(request('/'+company.id),{DB});const saved=(await reread.json()).company;assert.equal(saved.notes,'Proposal requested');assert.equal(saved.followUp,'2026-11-10');assert.equal(saved.contacted,true);
 }finally{DB.close();}
});
test('rejects cross-origin writes and invalid user input without changing data',async()=>{
 const DB=database();try{
  assert.equal((await handleApi(request('','POST',valid(),{Origin:'https://attacker.example'}),{DB})).status,403);
  for(const patch of [{name:''},{team:'Hidden team'},{product:'other'},{crm:'true'},{website:'javascript:alert(1)'},{followUp:'2026-02-30'},{phone:123}]) {
   const response=await handleApi(request('','POST',{...valid(),...patch}),{DB});assert.equal(response.status,400,JSON.stringify(patch));
  }
  assert.equal((await handleApi(request('/missing','PUT',valid()),{DB})).status,404);
  assert.equal((await handleApi(request('','DELETE'),{DB})).status,405);
  const all=await handleApi(request(),{DB});assert.equal((await all.json()).companies.length,46);
 }finally{DB.close();}
});
test('preserves spreadsheet provenance and extra fields when editing',async()=>{
 const DB=database();try{const original=valid();const saved=await handleApi(request('/'+original.id,'PUT',{...original,sourceRow:9999,extraFields:{injected:'no'},notes:'New note'}),{DB});const c=(await saved.json()).company;assert.equal(c.sourceRow,original.sourceRow);assert.deepEqual(c.extraFields,original.extraFields);}finally{DB.close();}
});
test('rejects oversized request bodies',async()=>{
 const DB=database();try{const response=await handleApi(request('','POST',{...valid(),notes:'x'.repeat(70000)}),{DB});assert.equal(response.status,400);}finally{DB.close();}
});

test('every imported company can be edited, including bare domain URLs',()=>{ for(const company of workbook.companies)assert.ok(validateCompany(company));assert.equal(validateCompany({...valid(),website:'ccbe.lk'}).website,'https://ccbe.lk/'); });
