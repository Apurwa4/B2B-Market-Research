'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import type { Company } from '@/lib/types';

const series = [
  { key: 'researched', label: 'Researched', color: 'research' },
  { key: 'crm', label: 'In CRM', color: 'crm' },
  { key: 'contacted', label: 'Contacted', color: 'contact' },
] as const;

export default function TeamPerformance({ companies, teams, onSelectTeam }: {
  companies: Company[];
  teams: string[];
  onSelectTeam: (team: string, product: string) => void;
}) {
  const [product, setProduct] = useState('All products');
  const summary = useMemo(() => teams.map(team => {
    const records = companies.filter(c => c.team === team && (product === 'All products' || c.product === product));
    const contacted = records.filter(c => c.contacted).length;
    return {
      team, researched: records.length, crm: records.filter(c => c.crm).length, contacted,
      rate: records.length ? Math.round(contacted / records.length * 100) : 0,
      ready: records.filter(c => c.crm && !c.contacted).length,
    };
  }), [companies, teams, product]);
  const tickStep = Math.max(1, Math.ceil(Math.max(...summary.map(t => t.researched), 0) / 4));
  const maximum = tickStep * 4;
  const total = summary.reduce((sum, t) => sum + t.researched, 0);
  const contacted = summary.reduce((sum, t) => sum + t.contacted, 0);
  const ready = summary.reduce((sum, t) => sum + t.ready, 0);

  return <section className="team-performance" aria-labelledby="performance-heading">
    <div className="section-heading performance-heading">
      <div><h2 id="performance-heading">Team performance</h2><p>Compare research and outreach across your teams. Select a team to see its companies.</p></div>
      <label className="select-wrap performance-filter"><span className="sr-only">Chart product</span><select aria-label="Chart product" value={product} onChange={e => setProduct(e.target.value)}><option>All products</option><option>GTe</option><option>GTa</option></select><ChevronDown size={13}/></label>
    </div>
    <div className="performance-grid">
      <article className="panel performance-panel">
        <div className="panel-heading"><div><h2>Research & outreach volume</h2><p>Number of companies per team · {product}</p></div><span className="count-badge">{total} companies</span></div>
        <ul className="chart-legend" aria-label="Chart legend">{series.map(s => <li key={s.key}><span className={`legend-dot series-${s.color}`}/>{s.label}</li>)}</ul>
        <div className="volume-chart" role="group" aria-label="Company counts by team">
          <div className="chart-scale" aria-hidden="true"><span>Companies</span><div>{[0,1,2,3,4].map(n => <span key={n}>{maximum * n / 4}</span>)}</div></div>
          {summary.map(t => <button className="volume-row" key={t.team} onClick={() => onSelectTeam(t.team, product)} aria-label={`View ${t.team}: ${t.researched} researched, ${t.crm} in CRM, ${t.contacted} contacted`}>
            <span className="chart-team-name">{t.team.replace('Team ', '')}<ArrowUpRight size={12}/></span>
            <span className="bar-group">{series.map(s => <span className="bar-line" key={s.key} title={`${t.team} · ${s.label}: ${t[s.key]}`}><span className="bar-track"><span className={`chart-bar series-${s.color}`} style={{ width: `${t[s.key] / maximum * 100}%` }}/></span><strong className="bar-value">{t[s.key]}</strong></span>)}</span>
          </button>)}
        </div>
        <p className="chart-footnote">A company can be counted in more than one status.</p>
      </article>
      <article className="panel performance-panel coverage-panel">
        <div className="panel-heading"><div><h2>Outreach completion</h2><p>Contacted companies ÷ all researched companies</p></div></div>
        <div className="coverage-summary"><strong>{total ? Math.round(contacted / total * 100) : 0}<span>%</span></strong><div><b>{contacted} of {total} companies contacted</b><span>{ready} in CRM and ready for a first contact</span></div></div>
        <div className="coverage-chart" role="group" aria-label="Contact completion rate by team">{summary.map((t, i) => <button key={t.team} className="coverage-row" onClick={() => onSelectTeam(t.team, product)} aria-label={`View ${t.team}: ${t.contacted} of ${t.researched} contacted, ${t.rate}% completion`}>
          <span className="coverage-label"><span><i className={`team-dot dot-${i}`}/>{t.team.replace('Team ', '')}</span><strong>{t.researched ? `${t.rate}%` : '—'}</strong></span>
          <span className="coverage-track"><span className={`progress-${i}`} style={{width: `${t.rate}%`}}/></span>
          <span className="coverage-detail">{t.researched ? `${t.contacted} of ${t.researched} contacted` : 'No companies for this product'}</span>
        </button>)}</div>
        <p className="chart-footnote">Current saved statuses · updates when company records change.</p>
      </article>
    </div>
  </section>;
}
