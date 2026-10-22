"""Import visible worksheet records and Home links. Never imports hidden tabs."""
import sys, zipfile, json, re
from pathlib import Path
import xml.etree.ElementTree as E

NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
RID='{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
def extract(path):
 with zipfile.ZipFile(path) as z:
  shared=[''.join(t.text or '' for t in s.iter('{'+NS['m']+'}t')) for s in E.fromstring(z.read('xl/sharedStrings.xml'))]
  rel={r.attrib['Id']:r.attrib['Target'] for r in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
  records=[]; resources=[]; steps=[]; teams=[]; counts={}; unmapped=[]
  for sheet in E.fromstring(z.read('xl/workbook.xml')).find('m:sheets',NS):
   if sheet.attrib.get('state','visible')!='visible':continue
   name=sheet.attrib['name']; target=rel[sheet.attrib[RID]]
   target=target.lstrip('/') if target.startswith('/') else 'xl/'+target
   root=E.fromstring(z.read(target)); rows={}
   for row in root.findall('m:sheetData/m:row',NS):
    values={}
    for c in row:
     v=c.find('m:v',NS); val=v.text if v is not None else ''.join(t.text or '' for t in c.findall('.//m:t',NS))
     if c.attrib.get('t')=='s' and val:val=shared[int(val)]
     if val is not None and val!='':values[re.sub('[0-9]','',c.attrib['r'])]=val.strip()
    rows[int(row.attrib['r'])]=values
   if name=='Home':
    home={'title':rows[2]['A'],'description':rows[5]['A']}
    steps=[rows[i]['A'] for i in range(9,16)]
    rp=str(Path(target).parent/'_rels'/(Path(target).name+'.rels'))
    links={r.attrib['Id']:r.attrib['Target'] for r in E.fromstring(z.read(rp))}
    for h in root.findall('.//m:hyperlink',NS):
     row=int(re.sub('[A-Z]','',h.attrib['ref']))
     resources.append({'name':rows[row]['A'].strip(),'url':links[h.attrib[RID]],'category':'References' if row<25 else 'Resources'})
    continue
   team=name.strip(); teams.append(team); counts[team]=0
   compact='E' in rows.get(2,{}) and rows[2].get('E')=='Type'
   mapping=({'member':'A','product':'B','name':'C','phone':'D','industry':'E','address':'F','website':'G','social':'H','crm':'I','contacted':'J'} if compact else {'member':'A','product':'B','name':'C','phone':'D','industry':'G','contactPerson':'H','address':'I','website':'J','social':'K','source':'L','pitch':'M','crm':'N','contacted':'O'})
   for row, vals in rows.items():
    if row<=2:continue
    if not vals.get('C'):
     if any(v and v not in ['0','1'] for v in vals.values()):unmapped.append({'sheet':team,'row':row,'cells':vals})
     continue
    obj={k:vals.get(col,'') for k,col in mapping.items()}
    obj['crm']=str(obj['crm']).upper() in ['1','TRUE'];obj['contacted']=str(obj['contacted']).upper() in ['1','TRUE']
    # Scientific notation is an Excel numeric encoding, not the intended display.
    phone=obj['phone']
    if re.fullmatch(r'\d+(?:\.\d+)?E[+-]?\d+',phone,re.I):phone=str(int(float(phone)))
    if re.fullmatch(r'\d{9}',phone):phone='0'+phone
    obj['phone']=phone
    extra={k:v for k,v in vals.items() if k not in mapping.values()}
    obj.update({'id':f"{sheet.attrib['sheetId']}-{row}",'team':team,'sourceRow':row,'notes':'\n'.join(v for k,v in extra.items() if v not in ['0','1']),'extraFields':extra,'bookletSent':False,'followUp':'','outcome':'','updatedAt':''})
    for field in ['contactPerson','source','pitch','social','website','address','industry','member']:obj.setdefault(field,'')
    records.append(obj);counts[team]+=1
  return {'home':home,'steps':steps,'resources':resources,'teams':teams,'companies':records,'importInfo':{'counts':counts,'visibleTabs':['Home']+teams,'unassignedRows':unmapped,'source':'iGT Winter 26.27 | Centralized Market Research','resourceCount':len(resources)}}
if __name__=='__main__':
 data=extract(sys.argv[1]);Path('data/workbook.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
 print(json.dumps({'companies':len(data['companies']),'counts':data['importInfo']['counts'],'resources':len(data['resources']),'unassignedRows':len(data['importInfo']['unassignedRows'])}))
