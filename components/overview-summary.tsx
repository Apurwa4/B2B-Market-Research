'use client';

import { ArrowRight, Building2, CalendarClock, CheckCheck, ClipboardList, Phone } from 'lucide-react';
import type { Company } from '@/lib/types';
import { followUpState, formatFollowUp } from '@/lib/follow-ups.mjs';

export default function OverviewSummary({ companies, onFilter, onOpen }: {
  companies: Company[];
  onFilter: (status: string) => void;
  onOpen: (company: Company) => void;
}) {
  const total = companies.length;
  const contacted = companies.filter(c => c.contacted).length;
  const crm = companies.filter(c => c.crm).length;
  const ready = companies.filter(c => c.crm && !c.contacted).length;
  const due = companies.filter(c => ['overdue', 'today'].includes(followUpState(c.followUp))).sort((a, b) => a.followUp.localeCompare(b.followUp));
  const rate = total ? Math.round(contacted / total * 100) : 0;
  const stats = [
    { label: 'Companies researched', value: total, note: 'Across all four teams', icon: Building2, kind: 'neutral', filter: 'All statuses' },
    { label: 'Added to CRM', value: crm, note: `${total ? Math.round(crm / total * 100) : 0}% of your directory`, icon: ClipboardList, kind: 'green', filter: 'In CRM' },
    { label: 'Companies contacted', value: contacted, note: `${rate}% contact completion`, icon: Phone, kind: 'blue', filter: 'Contacted' },
    { label: 'Follow-ups due', value: due.length, note: 'Today and overdue', icon: CalendarClock, kind: 'orange', filter: 'Follow-ups due' },
  ];
  return <>
    <section className="overview-pulse" aria-label="Outreach summary">
      <div className="pulse-copy"><span className="banner-label"><span/> WINTER 26.27 · TEAM WORKSPACE</span><h2>Turn your research<br/>into the next conversation.</h2><p>{ready ? `${ready} companies are in CRM and ready for a first contact.` : 'Keep company research and next steps moving in one place.'}</p><button onClick={() => onFilter('Ready for outreach')}>Open outreach queue <ArrowRight size={17}/></button></div>
      <div className="pulse-progress"><div className="completion-ring" style={{ background: `conic-gradient(#c6e895 ${rate}%, #ffffff1c 0)` }}><div><strong>{rate}<span>%</span></strong><small>contacted</small></div></div><div><span className="pulse-progress-label"><CheckCheck size={16}/> Outreach progress</span><strong>{contacted} <span>of {total} companies</span></strong><p>Based on current saved statuses</p></div></div>
    </section>
    <section className="stats-grid" aria-label="Research statistics">{stats.map(s => <button className={`stat-card metric-card metric-${s.kind}`} key={s.label} onClick={() => onFilter(s.filter)}><div><span>{s.label}</span><span className={`stat-icon ${s.kind}`}><s.icon size={19}/></span></div><strong>{s.value.toLocaleString()}</strong><small><span className={`stat-dot ${s.kind}`}/>{s.note}<ArrowRight size={13}/></small></button>)}</section>
    <section className="followup-focus panel" aria-labelledby="followup-heading"><div className="followup-focus-heading"><span className="focus-icon"><CalendarClock size={21}/></span><div><h2 id="followup-heading">Your next moves <span className="count-badge">{due.length} due</span></h2><p>{due.length ? 'Scheduled follow-ups for today and earlier. Open a company to review its next step.' : 'No follow-ups due. Add a follow-up date to a company to keep the conversation moving.'}</p></div><button className="text-button" onClick={() => onFilter('Follow-up scheduled')}>All follow-ups <ArrowRight size={14}/></button></div>{due.length > 0 && <div className="due-list">{due.slice(0, 3).map(c => <button className="due-item" key={c.id} onClick={() => onOpen(c)}><span className={`due-date ${followUpState(c.followUp)}`}><CalendarClock size={13}/>{followUpState(c.followUp) === 'today' ? 'Today' : 'Overdue'}</span><strong>{c.name}</strong><small>{c.member || c.team} · {formatFollowUp(c.followUp)}</small><ArrowRight size={15}/></button>)}</div>}</section>
  </>;
}
