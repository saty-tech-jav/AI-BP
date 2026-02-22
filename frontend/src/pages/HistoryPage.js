import React, { useState, useEffect, useRef } from 'react';
import { readingsAPI } from '../services/api';
import { getCategoryStyle, RANGES } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const toInputDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtDate = (s) => { if (!s) return ''; const [y,m,d]=s.split('-'); return new Date(+y,+m-1,+d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); };
const ITEMS_PER_PAGE = 10;

// Reliable mobile detection using matchMedia (CSS-based, always correct)
const isMobileDevice = () => window.matchMedia('(max-width: 767px)').matches;

function MobileCard({ r, idx, onDelete, deleting }) {
  const cs = getCategoryStyle(r.category);
  return (
    <div style={{ background:'var(--card)', borderRadius:14, padding:'16px 14px', marginBottom:10, border:'1px solid var(--card-border)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--text3)', flexShrink:0 }}>{idx}</div>
          <span style={{ fontSize:12, color:'var(--text3)' }}>{r.recordedAt}</span>
        </div>
        <button onClick={() => onDelete(r.id)} disabled={deleting===r.id}
          style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13, color:'#ef4444', minHeight:36 }}>
          {deleting===r.id ? '…' : '🗑️'}
        </button>
      </div>

      {/* Grid layout — never overflows */}
      <div style={{ display:'grid', gridTemplateColumns: r.pulse ? '1fr 1fr 1fr' : '1fr 1fr', gap:8, marginBottom:12 }}>
        <div style={{ background:'var(--bg3)', borderRadius:10, padding:'12px 6px', textAlign:'center' }}>
          <div style={{ fontSize:9, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>SYS</div>
          <div style={{ fontSize:34, fontWeight:800, color:'var(--val-sys)', lineHeight:1 }}>{r.systolic}</div>
          <div style={{ fontSize:9, color:'var(--text3)', marginTop:3 }}>mmHg</div>
        </div>
        <div style={{ background:'var(--bg3)', borderRadius:10, padding:'12px 6px', textAlign:'center' }}>
          <div style={{ fontSize:9, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>DIA</div>
          <div style={{ fontSize:34, fontWeight:800, color:'var(--val-dia)', lineHeight:1 }}>{r.diastolic}</div>
          <div style={{ fontSize:9, color:'var(--text3)', marginTop:3 }}>mmHg</div>
        </div>
        {r.pulse && (
          <div style={{ background:'var(--bg3)', borderRadius:10, padding:'12px 6px', textAlign:'center' }}>
            <div style={{ fontSize:9, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>PULSE</div>
            <div style={{ fontSize:34, fontWeight:800, color:'var(--val-pulse)', lineHeight:1 }}>{r.pulse}</div>
            <div style={{ fontSize:9, color:'var(--text3)', marginTop:3 }}>bpm</div>
          </div>
        )}
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ padding:'5px 12px', borderRadius:7, background:cs.bg, border:`1px solid ${cs.border}`, color:cs.color, fontSize:11, fontWeight:700 }}>{r.category}</span>
        <span style={{ fontSize:11, color:'var(--text3)', background:'var(--bg3)', padding:'4px 10px', borderRadius:6 }}>
          {r.readingType==='VOICE'?'🎙️':r.readingType==='TEXT'?'💬':'✍️'} {r.readingType||'MANUAL'}
        </span>
      </div>
      {r.notes && (
        <div style={{ marginTop:10, fontSize:12, color:'var(--text3)', fontStyle:'italic', paddingTop:10, borderTop:'1px solid var(--border)' }}>📝 {r.notes}</div>
      )}
    </div>
  );
}

function DateSheet({ show, onClose, customFrom, customTo, setCustomFrom, setCustomTo, todayStr, onApply, onQuick }) {
  if (!show) return null;
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, backdropFilter:'blur(4px)' }} />
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:1001, background:'var(--bg2)', borderRadius:'24px 24px 0 0', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ width:40, height:4, borderRadius:2, background:'var(--border-strong)', margin:'14px auto 0' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 0' }}>
          <span style={{ fontWeight:800, fontSize:17, color:'var(--text)' }}>📅 Date Range</span>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--text3)', cursor:'pointer', fontSize:16 }}>✕</button>
        </div>
        <div style={{ padding:'20px 20px calc(env(safe-area-inset-bottom, 24px) + 24px)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:24 }}>
            {[{l:'Today',d:0},{l:'7 Days',d:7},{l:'30 Days',d:30},{l:'90 Days',d:90},{l:'6 Months',d:180},{l:'1 Year',d:365}].map(({l,d}) => (
              <button key={l} onClick={() => onQuick(d)} style={{ padding:'14px 8px', borderRadius:12, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text2)', fontSize:13, fontWeight:600, cursor:'pointer', minHeight:50 }}>{l}</button>
            ))}
          </div>
          <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>From</label>
          <input type="date" className="input" value={customFrom} max={customTo||todayStr} onChange={e=>setCustomFrom(e.target.value)} style={{ marginBottom:14 }} />
          <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', marginBottom:8 }}>To</label>
          <input type="date" className="input" value={customTo} min={customFrom} max={todayStr} onChange={e=>setCustomTo(e.target.value)} style={{ marginBottom:20 }} />
          <button className="btn btn-primary" onClick={onApply} style={{ width:'100%' }}>Apply Range</button>
        </div>
      </div>
    </>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const todayStr = toInputDate(new Date());
  const pickerRef = useRef(null);
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
  // FIX: Use matchMedia instead of window.innerWidth — always returns correct CSS pixels
  const [isMobile, setIsMobile] = useState(isMobileDevice());

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const fn = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const fn = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setTimeout(() => setShowPicker(false), 100); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [isMobile]);

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
      if (range==='today'&&!isCustom) data = data.filter(r=>(r.recordedAt||'').slice(0,10)===todayStr);
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

  const fA = { padding:'9px 18px', borderRadius:99, cursor:'pointer', fontWeight:700, fontSize:13, border:'none', background:'var(--btn-bg)', color:'#fff', boxShadow:'var(--btn-shadow)', whiteSpace:'nowrap', flexShrink:0, minHeight:42 };
  const fI = { padding:'9px 18px', borderRadius:99, cursor:'pointer', fontWeight:600, fontSize:13, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text2)', whiteSpace:'nowrap', flexShrink:0, minHeight:42 };

  return (
    <div className="fade-in" style={{ padding: isMobile ? '14px 12px 100px' : '24px 28px' }}>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18, gap:10 }}>
        <div>
          <h1 style={{ fontWeight:800, fontSize: isMobile ? 26 : 30, color:'var(--text)', letterSpacing:'-0.02em' }}>History</h1>
          <p style={{ color:'var(--text3)', marginTop:3, fontSize:13 }}>
            {readings.length} reading{readings.length!==1?'s':''}
            {activeLabel && <span style={{ marginLeft:6, color:'var(--accent)', fontWeight:600 }}>· {activeLabel}</span>}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/log')}>+ Log</button>
      </div>

      <div ref={pickerRef} style={{ position:'relative', marginBottom:16 }}>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, WebkitOverflowScrolling:'touch', msOverflowStyle:'none', scrollbarWidth:'none' }}>
          <button onClick={()=>clickRange('all')} style={!isCustom&&range==='all'?fA:fI}>All</button>
          <button onClick={()=>clickRange('today')} style={!isCustom&&range==='today'?fA:fI}>Today</button>
          {RANGES.slice(1,5).map(r=>(
            <button key={r.value} onClick={()=>clickRange(r.value)} style={!isCustom&&range===r.value?fA:fI}>{r.label}</button>
          ))}
          <div style={{ position:'relative', flexShrink:0 }}>
            <button onClick={()=>setShowPicker(v=>!v)} style={{ ...(isCustom?fA:fI), display:'flex', alignItems:'center', gap:5 }}>
              📅 {isCustom?activeLabel:'Custom'}
            </button>
            {isCustom && (
              <button onClick={clearCustom} style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'#ef4444', border:'2px solid var(--bg)', color:'#fff', fontSize:8, cursor:'pointer', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2, lineHeight:1 }}>✕</button>
            )}
          </div>
        </div>
        {!isMobile && showPicker && (
          <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:9999, background:'var(--bg2)', border:'1px solid var(--border-strong)', borderRadius:16, padding:20, boxShadow:'0 16px 48px rgba(0,0,0,0.35)', width:300 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontWeight:800, fontSize:14, color:'var(--text)' }}>📅 Date Range</span>
              <button onClick={()=>setShowPicker(false)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', marginBottom:6 }}>From</label>
            <input type="date" className="input" value={customFrom} max={customTo||todayStr} onChange={e=>setCustomFrom(e.target.value)} style={{ marginBottom:12, minHeight:44 }} />
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', marginBottom:6 }}>To</label>
            <input type="date" className="input" value={customTo} min={customFrom} max={todayStr} onChange={e=>setCustomTo(e.target.value)} style={{ marginBottom:16, minHeight:44 }} />
            <button className="btn btn-primary" onClick={applyCustom} style={{ width:'100%', minHeight:44 }}>Apply</button>
          </div>
        )}
      </div>

      {isMobile && <DateSheet show={showPicker} onClose={()=>setShowPicker(false)} customFrom={customFrom} customTo={customTo} setCustomFrom={setCustomFrom} setCustomTo={setCustomTo} todayStr={todayStr} onApply={applyCustom} onQuick={quickApply} />}

      {summary?.totalReadings > 0 && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: isMobile ? 8 : 12, marginBottom:14 }}>
          {[
            { label:'Avg BP', value:`${summary.avgSystolic}/${summary.avgDiastolic}`, unit:'mmHg' },
            { label:'Avg Pulse', value:summary.avgPulse>0?summary.avgPulse:'—', unit:summary.avgPulse>0?'bpm':'' },
            !isMobile && { label:'Status', value:summary.category },
            !isMobile && { label:'Trend', value:summary.trend },
          ].filter(Boolean).map(s=>(
            <div key={s.label} className="card" style={{ padding:'12px' }}>
              <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:5 }}>{s.label}</div>
              <div style={{ fontWeight:700, fontSize:14, color:'var(--text)' }}>{s.value}{s.unit&&<span style={{ fontSize:10, color:'var(--text3)', fontWeight:400, marginLeft:3 }}>{s.unit}</span>}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}><div className="spinner" /></div>
      ) : readings.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>📋</div>
          <div style={{ fontWeight:800, fontSize:18, marginBottom:8 }}>No readings found</div>
          <div style={{ color:'var(--text3)', marginBottom:24, fontSize:14 }}>Try a different time range or log a new reading</div>
          <button className="btn btn-primary" onClick={()=>navigate('/log')}>+ Log Reading</button>
        </div>
      ) : (
        <>
          {isMobile ? (
            <div>
              {paginated.map((r,i) => (
                <MobileCard key={r.id} r={r} idx={(page-1)*ITEMS_PER_PAGE+i+1} onDelete={handleDelete} deleting={deleting} />
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--bg3)', borderBottom:'1px solid var(--border)' }}>
                      {['#','Date & Time','Systolic','Diastolic','Pulse','Category','Type','Notes',''].map(h => (
                        <th key={h} style={{ padding:'14px 16px', textAlign:['#','Systolic','Diastolic','Pulse','Category','Type'].includes(h)?'center':'left', fontWeight:600, fontSize:12, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((r,i) => {
                      const cs=getCategoryStyle(r.category), idx=(page-1)*ITEMS_PER_PAGE+i+1;
                      return (
                        <tr key={r.id} style={{ borderBottom:i<paginated.length-1?'1px solid var(--border)':'none' }}>
                          <td style={{ padding:'14px 16px', textAlign:'center', color:'var(--text3)', fontSize:12 }}>{idx}</td>
                          <td style={{ padding:'14px 16px', color:'var(--text2)', fontSize:13, whiteSpace:'nowrap' }}>{r.recordedAt}</td>
                          <td style={{ padding:'14px 16px', textAlign:'center' }}><span style={{ fontWeight:700, fontSize:18, color:'var(--val-sys)' }}>{r.systolic}</span></td>
                          <td style={{ padding:'14px 16px', textAlign:'center' }}><span style={{ fontWeight:700, fontSize:18, color:'var(--val-dia)' }}>{r.diastolic}</span></td>
                          <td style={{ padding:'14px 16px', textAlign:'center', color:'var(--text2)', fontWeight:600 }}>{r.pulse||'—'}</td>
                          <td style={{ padding:'14px 16px', textAlign:'center' }}><span style={{ padding:'4px 10px', borderRadius:6, background:cs.bg, border:`1px solid ${cs.border}`, color:cs.color, fontSize:12, fontWeight:600 }}>{r.category}</span></td>
                          <td style={{ padding:'14px 16px', textAlign:'center', fontSize:11, color:'var(--text3)' }}>{r.readingType==='VOICE'?'🎙️':r.readingType==='TEXT'?'💬':'✍️'}</td>
                          <td style={{ padding:'14px 16px', color:'var(--text3)', fontSize:13, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.notes||'—'}</td>
                          <td style={{ padding:'14px 16px' }}><button className="btn btn-sm" onClick={()=>handleDelete(r.id)} disabled={deleting===r.id} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', fontSize:12 }}>{deleting===r.id?'...':'🗑️'}</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {totalPages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, flexWrap:'wrap', gap:8 }}>
              <div style={{ fontSize:12, color:'var(--text3)' }}>{(page-1)*ITEMS_PER_PAGE+1}–{Math.min(page*ITEMS_PER_PAGE,readings.length)} of {readings.length}</div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid var(--border)', background:page===1?'var(--bg3)':'var(--card)', color:page===1?'var(--text3)':'var(--text)', cursor:page===1?'not-allowed':'pointer', fontSize:16, minHeight:40 }}>‹</button>
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid var(--border)', background:page===totalPages?'var(--bg3)':'var(--card)', color:page===totalPages?'var(--text3)':'var(--text)', cursor:page===totalPages?'not-allowed':'pointer', fontSize:16, minHeight:40 }}>›</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
