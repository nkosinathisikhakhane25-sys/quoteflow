'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { solarDemoEnquiries, SOLAR_DEMO_STORAGE_KEY } from '@/lib/solar-demo';
import { amount, dateLabel, isActive, localDate, metrics, money, STATUSES, type Enquiry, type EnquiryInput } from '@/lib/enquiries';

type View = 'Dashboard' | 'Enquiries' | 'Quotes' | 'Jobs' | 'Customers' | 'Settings';
const views: View[] = ['Dashboard','Enquiries','Quotes','Jobs','Customers','Settings'];
const blank: EnquiryInput = { customer_name:'', phone:'', email:'', service:'', location:'', quote_amount:null, status:'New', follow_up_date:null, notes:'' };

export default function Dashboard({ userId, userEmail, demo = false }: { userId: string; userEmail: string; demo?: boolean }) {
  const router = useRouter();
  const [items,setItems] = useState<Enquiry[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const [view,setView] = useState<View>('Dashboard');
  const [query,setQuery] = useState('');
  const [filter,setFilter] = useState('All statuses');
  const [editing,setEditing] = useState<Enquiry | null | 'new'>(null);
  const [form,setForm] = useState<EnquiryInput>(blank);
  const [formError,setFormError] = useState('');
  const [mobileNav,setMobileNav] = useState(false);
  const supabase = demo ? null : getSupabase();
  const persistDemo = (next: Enquiry[]) => {
    setItems(next);
    try { localStorage.setItem(SOLAR_DEMO_STORAGE_KEY, JSON.stringify(next)); }
    catch { setError("Browser storage is unavailable. Demo changes will last until you reload."); }
  };

  const load = useCallback(async () => {
    if (demo) {
      let rows = solarDemoEnquiries();
      try {
        const stored = localStorage.getItem(SOLAR_DEMO_STORAGE_KEY);
        const parsed: unknown = stored ? JSON.parse(stored) : null;
        if (Array.isArray(parsed) && parsed.every(row => row && typeof row.id === 'string' && typeof row.customer_name === 'string' && typeof row.status === 'string')) rows = parsed as Enquiry[];
      } catch { /* Start with sample enquiries if browser storage is unavailable. */ }
      setItems(rows); setLoading(false); return;
    }
    if (!supabase) { setError('Supabase is not configured. Add the project URL and publishable key to .env.local, then restart the server.'); setLoading(false); return; }
    setLoading(true); setError('');
    const { data,error } = await supabase.from('enquiries').select('*').eq('owner_user_id',userId).order('created_at',{ascending:false});
    if (error) setError(error.message); else setItems((data ?? []) as Enquiry[]);
    setLoading(false);
  },[supabase,userId,demo]);
  useEffect(()=>{ void load(); },[load]);
  useEffect(()=>{ if (!mobileNav) return; const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileNav(false); }; window.addEventListener('keydown', closeOnEscape); return () => window.removeEventListener('keydown', closeOnEscape); },[mobileNav]);

  const totals = useMemo(()=>metrics(items),[items]);
  const visible = useMemo(()=>items.filter(e=>{
    const text = [e.customer_name,e.phone,e.email,e.service,e.location].join(' ').toLowerCase();
    const matchesView = view==='Quotes' ? amount(e)>0 && isActive(e) : view==='Jobs' ? ['Won','Lost'].includes(e.status) : true;
    return matchesView && (filter==='All statuses' || e.status===filter) && text.includes(query.toLowerCase().trim());
  }),[items,filter,query,view]);
  const people = useMemo(()=>Array.from(new Map(items.map(e=>[e.customer_name.toLowerCase().trim(),e])).values()).sort((a,b)=>a.customer_name.localeCompare(b.customer_name)),[items]);

  const update = async (id:string, patch:Partial<EnquiryInput>) => {
    if (demo) { persistDemo(items.map(e=>e.id===id ? {...e,...patch} : e)); return; }
    if (!supabase) return;
    setBusy(true); setError('');
    const { data,error } = await supabase.from('enquiries').update(patch).eq('id',id).eq('owner_user_id',userId).select().single();
    if (error) setError(error.message); else setItems(prev=>prev.map(e=>e.id===id ? data as Enquiry : e));
    setBusy(false);
  };
  const openNew = () => { setForm(blank); setFormError(''); setEditing('new'); };
  const openEdit = (e:Enquiry) => { setForm({customer_name:e.customer_name,phone:e.phone,email:e.email,service:e.service,location:e.location,quote_amount:e.quote_amount,status:e.status,follow_up_date:e.follow_up_date,notes:e.notes}); setFormError(''); setEditing(e); };
  const save = async (event:React.FormEvent) => {
    event.preventDefault(); if (!supabase && !demo) return;
    if (!form.customer_name.trim()) { setFormError('Customer name is required.'); return; }
    if (form.quote_amount !== null && (!Number.isFinite(Number(form.quote_amount)) || Number(form.quote_amount)<0)) { setFormError('Enter a valid quote amount.'); return; }
    setBusy(true); setFormError('');
    const payload = { ...form, customer_name:form.customer_name.trim(), phone:form.phone?.trim() || null, email:form.email?.trim() || null, service:form.service?.trim() || null, location:form.location?.trim() || null, notes:form.notes?.trim() || null, quote_amount:form.quote_amount===null ? null : Number(form.quote_amount) };
    if (demo) {
      const saved: Enquiry = { ...payload, id: editing==='new' ? crypto.randomUUID() : (editing as Enquiry).id, owner_user_id: 'solar-demo', created_at: editing==='new' ? new Date().toISOString() : (editing as Enquiry).created_at };
      persistDemo(editing==='new' ? [saved,...items] : items.map(e=>e.id===saved.id?saved:e));
      setEditing(null); setBusy(false); return;
    }
    if (!supabase) { setBusy(false); return; }
    const result = editing==='new' ? await supabase.from('enquiries').insert({ ...payload, owner_user_id:userId }).select().single() : await supabase.from('enquiries').update(payload).eq('id',(editing as Enquiry).id).eq('owner_user_id',userId).select().single();
    if (result.error) setFormError(result.error.message); else { const saved=result.data as Enquiry; setItems(prev=>editing==='new' ? [saved,...prev] : prev.map(e=>e.id===saved.id?saved:e)); setEditing(null); }
    setBusy(false);
  };
  const signOut = async () => { if (!supabase) return; const { error } = await supabase.auth.signOut(); if (error) setError(error.message); else { router.replace('/login'); router.refresh(); } };
  const pageTitle = view==='Quotes' ? 'Open quotes' : view==='Jobs' ? 'Jobs' : view;
  const table = (rows:Enquiry[]) => <div className="table-scroll"><div className="scroll-hint">Swipe to view all columns →</div><table><thead><tr><th>Customer</th><th>Service</th><th>Location</th><th className="num">Quote</th><th>Status</th><th>Follow-up</th><th>Next action</th></tr></thead><tbody>{rows.map(e=><tr key={e.id}><td><button className="text-button customer" onClick={()=>openEdit(e)}>{e.customer_name}</button><span className="cell-sub">{e.phone || e.email || 'No contact details'}</span></td><td>{e.service || '—'}</td><td>{e.location || '—'}</td><td className="num money">{money(amount(e))}</td><td><select aria-label={`Status for ${e.customer_name}`} className={`status status-${e.status.toLowerCase().replace(/[^a-z]+/g,'-')}`} value={e.status} disabled={busy} onChange={ev=>void update(e.id,{status:ev.target.value})}>{!STATUSES.includes(e.status as typeof STATUSES[number]) && <option>{e.status}</option>}{STATUSES.map(s=><option key={s}>{s}</option>)}</select></td><td className={e.follow_up_date && e.follow_up_date<=localDate() && isActive(e) ? 'overdue':''}>{dateLabel(e.follow_up_date)}</td><td><button className="text-button action-link" onClick={()=>openEdit(e)}>Edit details</button></td></tr>)}</tbody></table>{rows.length===0 && <div className="empty">No enquiries match this view.</div>}</div>;
  const controls = <div className="table-controls"><label className="search"><span className="sr-only">Search enquiries</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search customer, service or location" /></label><label><span className="sr-only">Filter by status</span><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All statuses</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></label></div>;

  return <div className="shell">{mobileNav && <button className="mobile-nav-backdrop" aria-label="Close navigation" onClick={()=>setMobileNav(false)}/>}<aside className={`sidebar ${mobileNav?'open':''}`}><div className="brand"><span className="brand-mark">Q</span><span>QuoteFlow</span></div><nav id="mobile-navigation" aria-label="Main navigation">{views.map(v=><button key={v} className={`nav-item ${view===v?'selected':''}`} onClick={()=>{setView(v);setFilter('All statuses');setQuery('');setMobileNav(false);}}>{v}</button>)}{!demo && <button className="nav-item signout-item" onClick={()=>void signOut()}>Sign out</button>}</nav><div className="sidebar-foot">{demo ? 'Solar installation workspace' : 'Service operations'}<br/><span>{userEmail}</span></div></aside><main className="main"><div className="mobile-top"><span className="brand"><span className="brand-mark">Q</span>QuoteFlow</span><button className="secondary" onClick={()=>setMobileNav(!mobileNav)} aria-controls="mobile-navigation" aria-expanded={mobileNav}>{mobileNav?'Close':'Menu'}</button></div><header className="page-header"><div className="page-heading"><div className="eyebrow">WORKSPACE / {pageTitle.toUpperCase()}</div><h1>{pageTitle}</h1><p>{new Intl.DateTimeFormat('en-ZA',{month:'long',year:'numeric'}).format(new Date())}</p></div><label className="top-search"><span className="sr-only">Search enquiries</span><input value={query} onChange={e=>{setQuery(e.target.value);if(e.target.value)setView('Enquiries');}} placeholder="Search enquiries, customers, or services..." /></label>{view!=='Settings' && <button className="primary" onClick={openNew}>+ New Enquiry</button>}</header>
  {demo && <section className="demo-banner" aria-label="Solar demo"><div><strong>Prince Solar Solutions · Interactive demo</strong><p>Fictional customers · Changes stay in this browser. Try editing a quote, scheduling a follow-up, or adding an enquiry.</p></div><button className="secondary" onClick={()=>{persistDemo(solarDemoEnquiries());setQuery('');setFilter('All statuses');setView('Dashboard');}}>Reset demo</button></section>}
  {error && <div role="alert" className="alert"><span>{error}</span><button onClick={()=>void load()}>Retry</button></div>}
  {loading ? <div className="loading">Loading enquiries…</div> : <>
  {view==='Dashboard' && <><section className="overview" aria-label="Overview"><div className="hero-metric"><div className="eyebrow">OPEN QUOTE VALUE</div><div className="hero-value">{money(totals.openValue)}</div><p>{totals.activeQuotes} active {totals.activeQuotes===1?'quote':'quotes'} with a recorded value</p><div className="hero-rule"/><span>Value of active opportunities in your pipeline</span></div><div className="support-metrics"><div><span>New enquiries</span><strong>{totals.newCount}</strong><small>Currently in New stage</small></div><div><span>Quotes pending</span><strong>{totals.awaitingCount}</strong><small>At Quote Sent</small></div><div><span>Follow-ups due</span><strong>{totals.dueCount}</strong><small>Due today or earlier</small></div><div><span>Won revenue</span><strong>{money(totals.wonTotal)}</strong><small>All recorded wins</small></div></div></section><div className="dashboard-grid"><section className="panel priorities"><div className="section-heading"><div><div className="eyebrow">ACTION QUEUE</div><h2>Today’s priorities</h2></div></div><div className="priority-row"><div><strong>Quotes need attention</strong><span>Sent quotes awaiting a response</span></div><b>{totals.awaitingCount}</b></div><div className="priority-row"><div><strong>Follow-ups due today</strong><span>Active enquiries due today or earlier</span></div><b>{totals.dueCount}</b></div><div className="priority-row"><div><strong>Revenue to recover</strong><span>Value of overdue follow-ups</span></div><b>{money(totals.dueValue)}</b></div></section><section className="panel pipeline-panel"><div className="section-heading"><div><div className="eyebrow">WORK IN PROGRESS</div><h2>Sales pipeline</h2></div><span>{items.filter(isActive).length} active enquiries</span></div><div className="pipeline-scroll"><div className="scroll-hint">Swipe to view all stages →</div><div className="pipeline">{STATUSES.map(status=>{ const stage=items.filter(e=>e.status===status); return <div className="stage" key={status}><div className="stage-heading"><strong>{status}</strong><span>{stage.length}</span></div><div className="stage-value">{money(stage.reduce((n,e)=>n+amount(e),0))}</div>{stage.slice(0,4).map(e=><button className="pipeline-card" key={e.id} onClick={()=>openEdit(e)}><strong>{e.customer_name}</strong><span>{e.service || 'Service not specified'}</span><b>{money(amount(e))}</b>{e.follow_up_date && <small>Follow-up {dateLabel(e.follow_up_date)}</small>}<small>{e.location || 'No location'}</small></button>)}{stage.length===0 && <div className="stage-empty">No enquiries</div>}{stage.length>4 && <button className="more" onClick={()=>{setView('Enquiries');setFilter(status)}}>+ {stage.length-4} more</button>}</div>})}</div></div></section></div><section className="panel enquiries-panel"><div className="section-heading"><div><div className="eyebrow">RECORDS</div><h2>Recent enquiries</h2></div><button className="text-button action-link" onClick={()=>setView('Enquiries')}>View all enquiries →</button></div>{table(items.slice(0,8))}</section></>}
  {(view==='Enquiries'||view==='Quotes'||view==='Jobs') && <section className="panel list-panel"><div className="section-heading"><div><h2>{view==='Enquiries'?'All enquiries':view==='Quotes'?'Active quotes':'Won and lost jobs'}</h2><p>{visible.length} {visible.length===1?'record':'records'}</p></div></div>{controls}{table(visible)}</section>}
  {view==='Customers' && <section className="panel list-panel"><div className="section-heading"><div><h2>Customers</h2><p>{people.length} {people.length===1?'customer':'customers'} from enquiries</p></div></div><div className="customer-list">{people.map(e=><button key={e.id} onClick={()=>{setView('Enquiries');setQuery(e.customer_name)}}><strong>{e.customer_name}</strong><span>{e.email || e.phone || 'No contact details'}</span><span>View enquiries →</span></button>)}{people.length===0 && <div className="empty">Customers will appear when enquiries are added.</div>}</div></section>}
  {view==='Settings' && <section className="panel settings-panel"><h2>Workspace settings</h2><p>{demo ? 'This demo uses fictional solar installation enquiries saved only in this browser.' : 'QuoteFlow uses your configured Supabase project for enquiry records.'}</p><div className="setting-row"><span>Data connection</span><strong>{demo?'Demo · browser only':supabase?'Configured':'Not configured'}</strong></div><div className="setting-row"><span>Enquiry records</span><strong>{items.length}</strong></div><p className="fine-print">{demo ? 'Reset demo restores the sample pipeline. No real customer records are accessed.' : 'Configuration is managed through environment variables on the server.'}</p></section>}
  </>}
  </main>{editing && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setEditing(null)}}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><div className="eyebrow">ENQUIRY RECORD</div><h2 id="modal-title">{editing==='new'?'Add enquiry':'Edit enquiry'}</h2></div><button className="close" aria-label="Close" disabled={busy} onClick={()=>setEditing(null)}>×</button></div><form onSubmit={save}><div className="form-grid"><label>Customer name <span>*</span><input required value={form.customer_name} onChange={e=>setForm({...form,customer_name:e.target.value})}/></label><label>Service<input value={form.service||''} onChange={e=>setForm({...form,service:e.target.value})}/></label><label>Phone<input type="tel" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Email<input type="email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Location<input value={form.location||''} onChange={e=>setForm({...form,location:e.target.value})}/></label><label>Quote amount (ZAR)<input type="number" min="0" step="0.01" value={form.quote_amount??''} onChange={e=>setForm({...form,quote_amount:e.target.value===''?null:Number(e.target.value)})}/></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></label><label>Follow-up date<input type="date" value={form.follow_up_date||''} onChange={e=>setForm({...form,follow_up_date:e.target.value||null})}/></label><label className="full">Notes<textarea rows={3} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></label></div>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="modal-actions"><button type="button" className="secondary" disabled={busy} onClick={()=>setEditing(null)}>Cancel</button><button className="primary" disabled={busy}>{busy?'Saving…':editing==='new'?'Add enquiry':'Save changes'}</button></div></form></div></div>}</div>;
}
