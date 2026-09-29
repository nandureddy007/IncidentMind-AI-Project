import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, Archive, Check, ChevronRight, CircleHelp, Clock3, Command, Database, Filter, Gauge, Layers3, RefreshCw, Search, ShieldCheck, Siren, Sparkles, X, Zap } from 'lucide-react';
import TopologyScene from './TopologyScene';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const number = (value) => new Intl.NumberFormat('en-US').format(value);

function App() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [connected, setConnected] = useState(false);
  const [notice, setNotice] = useState('');
  const [scope, setScope] = useState('all');
  const [query, setQuery] = useState('');
  const [view, setView] = useState('overview');
  const [form, setForm] = useState({ service: '', severity: 'high', environment: 'production', error: '' });
  const [resolve, setResolve] = useState({ root_cause: '', resolution: '' });

  async function load() {
    try {
      const response = await fetch(`${API}/incidents`);
      if (!response.ok) throw new Error();
      setItems(await response.json());
      setConnected(true);
    } catch {
      setConnected(false);
      setNotice('Cannot reach the incident API. Check that the backend is running.');
    }
  }
  useEffect(() => { load(); }, []);

  const openCount = items.filter((item) => item.status === 'open').length;
  const resolvedCount = items.filter((item) => item.status === 'resolved').length;
  const latestIncident = [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  const filteredItems = useMemo(() => items
    .filter((item) => scope === 'all' || item.status === scope)
    .filter((item) => `${item.service} ${item.error} ${item.severity}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [items, scope, query]);

  async function createIncident(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`${API}/incidents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Could not create incident.');
      await load();
      setSelected(data.id);
      setAnalysis(null);
      setShowForm(false);
      setScope('all');
      setNotice('Incident reported. Run an investigation when you are ready.');
      setForm({ service: '', severity: 'high', environment: 'production', error: '' });
    } catch (error) { setNotice(error.message); } finally { setBusy(false); }
  }

  async function analyzeIncident(id) {
    setSelected(id);
    setBusy(true);
    try {
      const response = await fetch(`${API}/incidents/${id}/analyze`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Analysis failed.');
      setAnalysis(data);
      setResolve({ root_cause: data.possible_root_cause, resolution: data.recommended_actions?.[0] || '' });
    } catch (error) { setNotice(error.message); } finally { setBusy(false); }
  }

  async function savePostmortem() {
    setBusy(true);
    try {
      const response = await fetch(`${API}/incidents/${selected}/resolve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resolve) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Could not save postmortem.');
      setNotice('Resolution saved to incident memory.');
      setAnalysis(null);
      await load();
    } catch (error) { setNotice(error.message); } finally { setBusy(false); }
  }

  const current = items.find((item) => item.id === selected);

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#overview" onClick={() => setView('overview')}><span className="brand-mark"><Command size={19} /></span><span><strong>IncidentMind</strong><small>RESPONSE SYSTEMS</small></span></a>
      <div className="side-label">WORKSPACE</div>
      <button className={`side-link ${view === 'overview' ? 'selected' : ''}`} onClick={() => { setView('overview'); setScope('all'); }}><Activity size={17} /><span>Command center</span><span className="side-count">{openCount}</span></button>
      <button className={`side-link ${view === 'history' ? 'selected' : ''}`} onClick={() => { setView('history'); setScope('all'); }}><Layers3 size={17} /><span>Incident history</span></button>
      <button className={`side-link ${view === 'memory' ? 'selected' : ''}`} onClick={() => { setView('memory'); setScope('resolved'); }}><Archive size={17} /><span>Resolution memory</span><span className="side-count">{resolvedCount}</span></button>
      <div className="side-divider" /><div className="side-label">SYSTEM</div>
      <div className="side-health"><span className={`health-light ${connected ? 'online' : ''}`} /><span>Incident API</span><b>{connected ? 'Connected' : 'Offline'}</b></div>
      <div className="sidebar-bottom"><div className="safety-mark"><ShieldCheck size={17} /></div><div><strong>Human-led response</strong><span>Recommendations need review.</span></div></div>
    </aside>

    <main className="workspace" id="overview">
      <header className="topbar"><div className="crumb"><span>OPERATIONS</span><ChevronRight size={13} /><strong>{view === 'memory' ? 'MEMORY' : view === 'history' ? 'HISTORY' : 'OVERVIEW'}</strong></div><div className="top-actions"><span className={`connection ${connected ? 'connected' : ''}`}><span />{connected ? 'API LINKED' : 'API OFFLINE'}</span><button className="button button-primary" onClick={() => setShowForm((visible) => !visible)}><Siren size={16} /> Report incident</button></div></header>

      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> INCIDENT RESPONSE / 01</div><h1>Stay ahead<br />of the <em>signal.</em></h1><p>One clear view of what’s broken, what came before, and what to do next.</p><div className="hero-status"><span className="pulse-dot" />{connected ? 'Incident memory is connected' : 'Waiting for incident API'}</div></div>
        <div className="hero-scene" aria-label="Three-dimensional incident topology"><TopologyScene incidentCount={items.length} openCount={openCount} /><div className="scene-caption"><span>01 / 03</span><span>INCIDENT TOPOLOGY</span></div><div className="scene-coordinate">MEMORY<br />&nbsp;&nbsp;↕<br />SIGNAL</div></div><div className="hero-index">IM<span>—</span>01</div>
      </section>

      <section className="metrics" aria-label="Incident metrics">
        <div className="metric"><span className="metric-icon coral"><Siren size={16} /></span><div><small>OPEN INCIDENTS</small><strong>{number(openCount)}</strong></div><span className="metric-note">Needs attention</span></div>
        <div className="metric"><span className="metric-icon green"><Check size={17} /></span><div><small>RESOLVED</small><strong>{number(resolvedCount)}</strong></div><span className="metric-note">Saved to memory</span></div>
        <div className="metric"><span className="metric-icon gold"><Database size={16} /></span><div><small>INCIDENT RECORDS</small><strong>{number(items.length)}</strong></div><span className="metric-note">Across your workspace</span></div>
        <div className="metric metric-engine"><span className="engine-orbit"><span /></span><div><small>MEMORY ENGINE</small><strong>{connected ? 'Ready' : 'Standby'}</strong></div><span className="metric-note">Historical recall</span></div>
      </section>

      {notice && <div className="notice" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={16} /></button></div>}
      {showForm && <form className="report-form" onSubmit={createIncident}><div className="form-heading"><div><span className="eyebrow">NEW SIGNAL</span><h2>Report an incident</h2></div><button type="button" className="icon-button" aria-label="Close report form" onClick={() => setShowForm(false)}><X size={18} /></button></div><div className="form-grid">
        <label>Service name<input required value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })} placeholder="Payment API" /></label>
        <label>Severity<select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value })}><option>critical</option><option>high</option><option>medium</option><option>low</option></select></label>
        <label>Environment<select value={form.environment} onChange={(event) => setForm({ ...form, environment: event.target.value })}><option>production</option><option>staging</option><option>development</option></select></label>
        <label className="form-wide">Error logs / symptoms<textarea required rows="3" value={form.error} onChange={(event) => setForm({ ...form, error: event.target.value })} placeholder="Paste the error message or describe the symptoms" /></label>
      </div><button className="button button-primary" disabled={busy}><Siren size={15} />{busy ? 'Creating…' : 'Create incident'}</button></form>}

      <div className="section-title"><div><span className="eyebrow"><span className="eyebrow-line" /> RESPONSE DESK</span><h2>{view === 'memory' ? 'Resolution memory' : view === 'history' ? 'Incident history' : 'Active workspace'}</h2></div><div className="section-tools"><span className="updated-label"><Clock3 size={14} />{latestIncident ? `Latest ${new Date(`${latestIncident.created_at}Z`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No incidents yet'}</span><button className="icon-button" title="Refresh incidents" onClick={load}><RefreshCw size={16} /></button></div></div>

      <div className="work-grid">
        <section className="incident-section">
          <div className="list-toolbar"><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search incidents" aria-label="Search incidents" /><kbd>/</kbd></label><div className="filter-group" aria-label="Filter incidents">{[['all', 'All'], ['open', 'Open'], ['resolved', 'Resolved']].map(([value, label]) => <button key={value} className={scope === value ? 'filter-active' : ''} onClick={() => setScope(value)}>{label}{value === 'open' && <span>{openCount}</span>}</button>)}</div></div>
          <div className="incident-list">{filteredItems.map((item, index) => <article className={`incident-row ${selected === item.id ? 'row-selected' : ''}`} key={item.id}>
            <button className="incident-main" onClick={() => { setSelected(item.id); setAnalysis(null); }}><span className={`incident-symbol severity-${item.severity}`}><Zap size={17} /></span><span className="incident-copy"><span className="incident-label"><span className={`severity-label severity-text-${item.severity}`}>{item.severity}</span><span className={`status-label status-${item.status}`}>{item.status}</span></span><strong>{item.service}</strong><span className="incident-error">{item.error}</span><span className="incident-time">{new Date(`${item.created_at}Z`).toLocaleString()}</span></span><span className="row-index">{String(index + 1).padStart(2, '0')}</span></button>
            <button className="analyze-button" onClick={() => analyzeIncident(item.id)} disabled={busy} aria-label={`Analyze ${item.service}`} title="Analyze incident">{busy && selected === item.id ? <RefreshCw className="spin" size={16} /> : <ArrowUpRight size={17} />}</button>
          </article>)}{!filteredItems.length && <div className="empty-list"><Filter size={20} /><strong>No matching incidents</strong><span>Try a different search or status filter.</span></div>}</div>
          <div className="list-footer"><span><span className="pulse-dot" />{connected ? 'SYNCED WITH INCIDENT API' : 'API CONNECTION REQUIRED'}</span><span>{filteredItems.length} RECORD{filteredItems.length === 1 ? '' : 'S'}</span></div>
        </section>

        <section className="investigation-section">
          <div className="investigation-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> INVESTIGATION</span><h2>{analysis ? 'Evidence & next steps' : 'Incident brief'}</h2></div><span className="ai-label"><Sparkles size={14} />{!analysis ? 'MEMORY-ASSISTED' : analysis.analysis_mode === 'openai_rag' ? 'LLM + MEMORY' : 'KEYWORD + MEMORY'}</span></div>
          {analysis ? <div className="investigation-content">
            <div className="brief-card"><div className="brief-topline"><span>INCIDENT SUMMARY</span><span className="brief-live"><span />ANALYZED</span></div><p>{analysis.summary}</p></div>
            <div className="cause-card"><div className="cause-heading"><span className="cause-icon"><Gauge size={16} /></span><span>POSSIBLE ROOT CAUSE</span><span className="confidence">{Math.round(analysis.confidence * 100)}% CONFIDENCE</span></div><h3>{analysis.possible_root_cause}</h3><div className="confidence-track"><span style={{ width: `${Math.max(0, Math.min(100, analysis.confidence * 100))}%` }} /></div></div>
            <div className="subsection-heading"><h3>Historical matches</h3><span>{analysis.similar_incidents.length} MEMORIES</span></div>
            {analysis.similar_incidents.length ? <div className="memory-list">{analysis.similar_incidents.map((memory) => <article className="memory-row" key={memory.id}><div className="memory-top"><span><Archive size={14} /> MEMORY #{memory.id}</span><b>{memory.similarity}% MATCH</b></div><p>{memory.root_cause}</p><small>RESOLUTION <span>{memory.resolution}</span></small></article>)}</div> : <div className="no-memory"><Database size={16} /><span>No similar resolved incidents found. Recommendations use general diagnostic steps.</span></div>}
            <div className="subsection-heading actions-heading"><h3>Recommended actions</h3><span>{analysis.recommended_actions.length} STEPS</span></div><ol className="action-list">{analysis.recommended_actions.map((action, index) => <li key={`${index}-${action}`}><span>{String(index + 1).padStart(2, '0')}</span>{action}</li>)}</ol>
            <div className="safety-note"><ShieldCheck size={16} /><span>{analysis.safety_note}</span></div>
            <div className="postmortem"><div className="subsection-heading"><h3>Resolve & remember</h3><span>HUMAN REVIEW</span></div><label>Confirmed root cause<input value={resolve.root_cause} onChange={(event) => setResolve({ ...resolve, root_cause: event.target.value })} /></label><label>Resolution / what fixed it<textarea rows="2" value={resolve.resolution} onChange={(event) => setResolve({ ...resolve, resolution: event.target.value })} /></label><button className="button button-primary resolve-button" disabled={busy} onClick={savePostmortem}><Check size={16} />{busy ? 'Saving…' : 'Resolve & remember'}</button></div>
          </div> : <div className="brief-empty"><div className="empty-graphic"><div className="empty-ring ring-one" /><div className="empty-ring ring-two" /><span><Activity size={23} /></span></div><span className="eyebrow">{current ? `${current.service.toUpperCase()} / READY` : 'WAITING FOR INPUT'}</span><h3>{current ? 'Signal selected.' : 'Start with an incident.'}</h3><p>{current ? 'Run an investigation to compare this report with resolved incident memory and get diagnostic steps.' : 'Select a record to inspect it, or report a new incident to start a memory-backed investigation.'}</p>{current ? <button className="button button-primary" onClick={() => analyzeIncident(current.id)} disabled={busy}><Sparkles size={15} />{busy ? 'Analyzing…' : 'Analyze incident'}</button> : <div className="empty-steps"><span><b>01</b> Capture the signal</span><span><b>02</b> Compare past incidents</span><span><b>03</b> Save what resolved it</span></div>}</div>}
        </section>
      </div>

      <footer className="workspace-footer"><span>INCIDENTMIND <b>—</b> RESPONSE SYSTEMS</span><span><ShieldCheck size={13} /> Recommendations are advisory. Validate before action.</span><button onClick={() => setNotice('This prototype uses transparent keyword overlap, not a production RCA model.')}><CircleHelp size={14} /> ABOUT THE ENGINE</button></footer>
    </main>
  </div>;
}

export default App;