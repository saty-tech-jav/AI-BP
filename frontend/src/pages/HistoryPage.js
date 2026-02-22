import React, { useState, useEffect, useRef } from 'react';
import { readingsAPI } from '../services/api';
import { getCategoryStyle, RANGES } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const toInputDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtDate = (s) => { if (!s) return ''; const [y,m,d]=s.split('-'); return new Date(+y,+m-1,+d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); };
const ITEMS_PER_PAGE = 15;

function ReadingCard({ r, idx, onDelete, deleting }) {
  const cs = getCategoryStyle(r.category);
  return (
    <div className="reading-card">
      <div className="reading-card-header">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span className="reading-idx">{idx}</span>
          <span className="reading-time">{r.recordedAt}</span>
        </div>
        <button
          onClick={() => onDelete(r.id)}
          disabled={deleting === r.id}
          className="delete-btn"
        >
          {deleting === r.id ? '…' : '🗑️'}
        </button>
      </div>

      <div className="reading-values">
        <div className="reading-val-box">
          <div className="val-label">SYS</div>
          <div className="val-num sys">{r.systolic}</div>
          <div className="val-unit">mmHg</div>
        </div>
        <div className="reading-val-box">
          <div className="val-label">DIA</div>
          <div className="val-num dia">{r.diastolic}</div>
          <div className="val-unit">mmHg</div>
        </div>
        {r.pulse && (
          <div className="reading-val-box">
            <div className="val-label">PULSE</div>
            <div className="val-num pulse">{r.pulse}</div>
            <div className="val-unit">bpm</div>
          </div>
        )}
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <span style={{ padding:'4px 10px', borderRadius:7, background:cs.bg, border:`1px solid ${cs.border}`, color:cs.color, fontSize:11, fontWeight:700 }}>{r.category}</span>
        <span style={{ fontSize:10, color:'var(--text3)', background:'var(--bg3)', padding:'3px 8px', borderRadius:5 }}>
          {r.readingType==='VOICE'?'🎙️':r.readingType==='TEXT'?'💬':'✍️'} {r.readingType||'MANUAL'}
        </span>
      </div>
      {r.notes && (
        <div style={{ marginTop:8, fontSize:12, color:'var(--text3)', fontStyle:'italic', paddingTop:8, borderTop:'1px solid var(--border)' }}>📝 {r.notes}</div>
      )}
    </div>
  );
}

function DateSheet({ show, onClose, customFrom, customTo, setCustomFrom, setCustomTo, todayStr, onApply, onQuick }) {
  if (!show) return null;
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000 }} />
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:1001, background:'var(--bg2)', borderRadius:'20px 20px 0 0', maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ width:36, height:4, borderRadius:2, background:'var(--border-strong)', margin:'12px auto 0' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 0' }}>
          <span style={{ fontWeight:800, fontSize:16, color:'var(--text)' }}>📅 Date Range</span>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--text3)', cursor:'pointer', fontSize:16 }}>✕</button>
        </div>
        <div style={{ padding:'16px 18px calc(env(safe-area-inset-bottom,16px) + 20px)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:18 }}>
            {[{l:'Today',d:0},{l:'7 Days',d:7},{l:'30 Days',d:30},{l:'90 Days',d:90},{l:'6 Months',d:180},{l:'1 Year',d:365}].map(({l,d}) => (
              <button key={l} onClick={() => onQuick(d)} style={{ padding:'13px 4px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text2)', fontSize:13, fontWeight:600, cursor:'pointer' }}>{l}</button>
            ))}
          </div>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>From</label>
          <input type="date" className="input" value={customFrom} max={customTo||todayStr} onChange={e=>setCustomFrom(e.target.value)} style={{ marginBottom:12 }} />
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>To</label>
          <input type="date" className="input" value={customTo} min={customFrom} max={todayStr} onChange={e=>setCustomTo(e.target.value)} style={{ marginBottom:18 }} />
          <button className="btn btn-primary" onClick={onApply} style={{ width:'100%' }}>Apply Range</button>
        </div>
      </div>
    </>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const todayStr = toInputDate(new Date());
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('today');
  const [deleting, setDeleting] = useState(null);
  const [summary, setSummary] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [customFrom, setCustomFrom] = useState(todayStr);
  const [customTo, setCustomTo] = useState(todayStr);
  const [isCustom, setIsCustom] = useState(false);
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setLoading(true); setPage(1);
    try {
      let readRes, sumRes;
      if (isCustom) {
        [readRes, sumRes] = await Promise.all([readingsAPI.getByCustomRange(customFrom,customTo), readingsAPI.getSummaryCustom(customFrom,customTo)]);
      } else if (range==='all') {
        [readRes, sumRes] = await Promise.all([readingsAPI.getAll(), readingsAPI.getSummary('all')]);
      } else {
        [readRes, sumRes] = await Promise.all([readingsAPI.getByRange(range), readingsAPI.getSummary(range)]);
      }
      let data = readRes.data||[];
      if (range==='today' && !isCustom) data = data.filter(r=>(r.recordedAt||'').slice(0,10)===todayStr);
      setReadings(data); setSummary(sumRes.data);
    } catch(e) { console.error(e); setReadings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [range, isCustom, customFrom, customTo]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reading?')) return;
    setDeleting(id);
    try { await readingsAPI.delete(id); setReadings(r=>r.filter(x=>x.id!==id)); }
    catch(e) { alert('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const applyCustom = () => { if (customFrom&&customTo) { setIsCustom(true); setShowPicker(false); } };
  const clearCustom = (e) => { e.stopPropagation(); setIsCustom(false); setRange('today'); setCustomFrom(todayStr); setCustomTo(todayStr); };
  const clickRange = (v) => { setRange(v); setIsCustom(false); setShowPicker(false); };
  const quickApply = (days) => {
    const to=new Date(), from=new Date();
    if (days>0) from.setDate(from.getDate()-days);
    setCustomFrom(toInputDate(from)); setCustomTo(toInputDate(to));
    setIsCustom(true); setShowPicker(false);
  };

  const activeLabel = isCustom
    ? (customFrom===customTo ? fmtDate(customFrom) : `${fmtDate(customFrom)} – ${fmtDate(customTo)}`)
    : (range==='all'?'All Time':RANGES.find(r=>r.value===range)?.label);

  const totalPages = Math.ceil(readings.length/ITEMS_PER_PAGE);
  const paginated = readings.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  const btnA = { padding:'9px 14px', borderRadius:99, cursor:'pointer', fontWeight:700, fontSize:13, border:'none', background:'var(--btn-bg)', color:'#fff', whiteSpace:'nowrap', flexShrink:0, minHeight:42 };
  const btnI = { padding:'9px 14px', borderRadius:99, cursor:'pointer', fontWeight:600, fontSize:13, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text2)', whiteSpace:'nowrap', flexShrink:0, minHeight:42 };

  return (
    <div className="fade-in page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-sub">
            {readings.length} reading{readings.length!==1?'s':''}
            {activeLabel && <span style={{ marginLeft:5, color:'var(--accent)', fontWeight:600 }}>· {activeLabel}</span>}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/log')}>+ Log</button>
      </div>

      {/* Filter scroll row */}
      <div className="filter-wrap">
        <div className="filter-scroll">
          <button onClick={()=>clickRange('all')} style={!isCustom&&range==='all'?btnA:btnI}>All</button>
          <button onClick={()=>clickRange('today')} style={!isCustom&&range==='today'?btnA:btnI}>Today</button>
          {RANGES.slice(1,5).map(r=>(
            <button key={r.value} onClick={()=>clickRange(r.value)} style={!isCustom&&range===r.value?btnA:btnI}>{r.label}</button>
          ))}
          <div style={{ position:'relative', flexShrink:0 }}>
            <button onClick={()=>setShowPicker(v=>!v)} style={{ ...(isCustom?btnA:btnI), display:'flex', alignItems:'center', gap:5 }}>
              📅 {isCustom?activeLabel:'Custom'}
            </button>
            {isCustom && (
              <button onClick={clearCustom} style={{ position:'absolute', top:-5, right:-5, width:18, height:18, borderRadius:'50%', background:'#ef4444', border:'2px solid var(--bg)', color:'#fff', fontSize:9, cursor:'pointer', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>✕</button>
            )}
          </div>
        </div>
      </div>

      <DateSheet show={showPicker} onClose={()=>setShowPicker(false)}
        customFrom={customFrom} customTo={customTo}
        setCustomFrom={setCustomFrom} setCustomTo={setCustomTo}
        todayStr={todayStr} onApply={applyCustom} onQuick={quickApply} />

      {/* Summary */}
      {summary?.totalReadings > 0 && (
        <div className="summary-grid">
          <div className="card summary-card">
            <div className="summary-label">Avg BP</div>
            <div className="summary-val">{summary.avgSystolic}/{summary.avgDiastolic} <span className="summary-unit">mmHg</span></div>
          </div>
          <div className="card summary-card">
            <div className="summary-label">Avg Pulse</div>
            <div className="summary-val">{summary.avgPulse>0?summary.avgPulse:'—'} <span className="summary-unit">{summary.avgPulse>0?'bpm':''}</span></div>
          </div>
          <div className="card summary-card">
            <div className="summary-label">Status</div>
            <div className="summary-val" style={{ fontSize:14 }}>{summary.category}</div>
          </div>
          <div className="card summary-card">
            <div className="summary-label">Trend</div>
            <div className="summary-val" style={{ fontSize:14 }}>{summary.trend}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}><div className="spinner" /></div>
      ) : readings.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'48px 20px' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
          <div style={{ fontWeight:800, fontSize:18, marginBottom:6 }}>No readings found</div>
          <div style={{ color:'var(--text3)', marginBottom:20, fontSize:13 }}>Try a different range</div>
          <button className="btn btn-primary" onClick={()=>navigate('/log')}>+ Log Reading</button>
        </div>
      ) : (
        <>
          {/* Cards — always shown, CSS hides on desktop and shows table instead */}
          <div className="cards-list">
            {paginated.map((r,i) => (
              <ReadingCard key={r.id} r={r} idx={(page-1)*ITEMS_PER_PAGE+i+1} onDelete={handleDelete} deleting={deleting} />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, flexWrap:'wrap', gap:8 }}>
              <div style={{ fontSize:12, color:'var(--text3)' }}>{(page-1)*ITEMS_PER_PAGE+1}–{Math.min(page*ITEMS_PER_PAGE,readings.length)} of {readings.length}</div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding:'8px 18px', borderRadius:10, border:'1.5px solid var(--border)', background: page===1?'var(--bg3)':'var(--card)', color: page===1?'var(--text3)':'var(--text)', cursor: page===1?'not-allowed':'pointer', fontSize:16, minHeight:42 }}>‹</button>
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ padding:'8px 18px', borderRadius:10, border:'1.5px solid var(--border)', background: page===totalPages?'var(--bg3)':'var(--card)', color: page===totalPages?'var(--text3)':'var(--text)', cursor: page===totalPages?'not-allowed':'pointer', fontSize:16, minHeight:42 }}>›</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
