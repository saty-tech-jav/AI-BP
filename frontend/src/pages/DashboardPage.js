import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { readingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCategoryStyle, RANGES } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const toInputDate = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};
const fmtDate = (s) => {
  if (!s) return '';
  const [y,m,d] = s.split('-');
  return new Date(+y,+m-1,+d).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border-strong)', borderRadius:12, padding:'10px 14px', fontSize:12, boxShadow:'0 8px 24px rgba(0,0,0,0.3)' }}>
      <div style={{ color:'var(--text2)', marginBottom:6, fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display:'flex', justifyContent:'space-between', gap:14, marginBottom:3, alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:p.color }} />
            <span style={{ color:'var(--text2)', fontSize:10 }}>{p.name}</span>
          </div>
          <strong style={{ fontFamily:'var(--mono)', color:p.color, fontSize:13 }}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* Mobile date bottom sheet */
function DateSheet({ show, onClose, customFrom, customTo, setCustomFrom, setCustomTo, todayStr, onApply, onQuick }) {
  if (!show) return null;
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, backdropFilter:'blur(4px)' }} />
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:1001, background:'var(--bg2)', borderRadius:'24px 24px 0 0', maxHeight:'90vh', overflowY:'auto', animation:'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ width:40, height:4, borderRadius:2, background:'var(--border-strong)', margin:'14px auto 0' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 0' }}>
          <span style={{ fontWeight:800, fontSize:17, color:'var(--text)' }}>📅 Date Range</span>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--text3)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>

        <div style={{ padding:'20px 20px calc(env(safe-area-inset-bottom, 24px) + 24px)' }}>
          {/* Quick select */}
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Quick Select</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:24 }}>
            {[{l:'Today',d:0},{l:'7 Days',d:7},{l:'30 Days',d:30},{l:'90 Days',d:90},{l:'6 Months',d:180},{l:'1 Year',d:365}].map(({l,d}) => (
              <button key={l} onClick={() => onQuick(d)} style={{ padding:'14px 8px', borderRadius:12, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text2)', fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'center', minHeight:48 }}>{l}</button>
            ))}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
            <span style={{ fontSize:11, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Custom range</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
          </div>

          <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>From</label>
          <input type="date" className="input" value={customFrom} max={customTo||todayStr} onChange={e=>setCustomFrom(e.target.value)} style={{ marginBottom:14 }} />

          <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>To</label>
          <input type="date" className="input" value={customTo} min={customFrom} max={todayStr} onChange={e=>setCustomTo(e.target.value)} style={{ marginBottom:20 }} />

          <button className="btn btn-primary" onClick={onApply} disabled={!customFrom||!customTo} style={{ width:'100%', opacity:(!customFrom||!customTo)?0.4:1 }}>
            Apply Range
          </button>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const todayStr = toInputDate(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const [range, setRange] = useState('today');
  const [graphData, setGraphData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [customFrom, setCustomFrom] = useState(todayStr);
  const [customTo, setCustomTo] = useState(todayStr);
  const [isCustom, setIsCustom] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (isMobile) return;
    // Use 'mousedown' but defer with setTimeout so the button onClick fires first
    const fn = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setTimeout(() => setShowPicker(false), 100);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [isMobile]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, sRes, aRes] = await Promise.all([
        isCustom ? readingsAPI.getGraphCustom(customFrom, customTo) : readingsAPI.getGraph(range),
        isCustom ? readingsAPI.getSummaryCustom(customFrom, customTo) : readingsAPI.getSummary(range),
        readingsAPI.getAll(),
      ]);
      let data = gRes.data.map(p => ({ ...p, name: p.timeLabel || p.timestamp }));
      if (range === 'today' && !isCustom) {
        // Use LOCAL date string (not UTC) — avoids IST/UTC mismatch
        const td = toInputDate(new Date());
        data = data.filter(p => (p.timestamp||p.timeLabel||'').slice(0,10) === td || !(p.timestamp||p.timeLabel));
      }
      setGraphData(data);
      setSummary(sRes.data);
      if (aRes.data.length > 0) setLatest(aRes.data[0]);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [range, isCustom, customFrom, customTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const applyCustom = () => { if (customFrom && customTo) { setIsCustom(true); setShowPicker(false); } };
  const clearCustom = (e) => { e.stopPropagation(); setIsCustom(false); setRange('today'); setCustomFrom(todayStr); setCustomTo(todayStr); };
  const clickRange = (v) => { setRange(v); setIsCustom(false); setShowPicker(false); };
  const quickApply = (days) => {
    const to = new Date(), from = new Date();
    if (days > 0) from.setDate(from.getDate() - days);
    setCustomFrom(toInputDate(from)); setCustomTo(toInputDate(to));
    setIsCustom(true); setShowPicker(false);
  };

  const catStyle = summary ? getCategoryStyle(summary.category) : {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const activeLabel = isCustom
    ? (customFrom === customTo ? fmtDate(customFrom) : `${fmtDate(customFrom)} – ${fmtDate(customTo)}`)
    : RANGES.find(r => r.value === range)?.label;

  const fA = { padding:'9px 18px', borderRadius:99, cursor:'pointer', fontWeight:700, fontSize:13, border:'none', background:'var(--btn-bg)', color:'#fff', boxShadow:'var(--btn-shadow)', flexShrink:0, whiteSpace:'nowrap', minHeight:40 };
  const fI = { padding:'9px 18px', borderRadius:99, cursor:'pointer', fontWeight:600, fontSize:13, border:'1.5px solid var(--border)', background:'var(--card)', color:'var(--text2)', flexShrink:0, whiteSpace:'nowrap', minHeight:40 };

  return (
    <div className="fade-in">

      {/* ── HEADER ── */}
      <div style={{ marginBottom: isMobile ? 20 : 32 }}>
        <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, letterSpacing:'0.06em', marginBottom:4 }}>{greeting} 👋</div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:10 }}>
          <h1 style={{ fontWeight:800, fontSize: isMobile ? 24 : 30, color:'var(--text)', letterSpacing:'-0.03em', lineHeight:1.1 }}>
            {user?.fullName?.split(' ')[0] || user?.username}'s Dashboard
          </h1>
          {!isMobile && (
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/log')}>+ Log Reading</button>
          )}
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      {/* Wrapper: position:relative so the dropdown anchors to it, overflow:visible so dropdown is NOT clipped */}
      <div ref={pickerRef} style={{ position:'relative', marginBottom: isMobile ? 18 : 26 }}>
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, WebkitOverflowScrolling:'touch', scrollbarWidth:'none', msOverflowStyle:'none' }}>
          {RANGES.slice(0,5).map(r => (
            <button key={r.value} onClick={() => clickRange(r.value)} style={!isCustom && range===r.value ? fA : fI}>{r.label}</button>
          ))}
          <div style={{ position:'relative', flexShrink:0 }}>
            <button onClick={() => setShowPicker(v => !v)} style={{ ...(isCustom ? fA : fI), display:'flex', alignItems:'center', gap:5 }}>
              📅 {isCustom ? activeLabel : 'Custom'}
            </button>
            {isCustom && (
              <button onClick={clearCustom} style={{ position:'absolute', top:-6, right:-6, width:18, height:18, borderRadius:'50%', background:'#ef4444', border:'2px solid var(--bg)', color:'#fff', fontSize:8, cursor:'pointer', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2, lineHeight:1 }}>✕</button>
            )}
          </div>
        </div>

        {/* Desktop dropdown — outside the overflow:auto div so it never gets clipped */}
        {!isMobile && showPicker && (
          <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:9999, background:'var(--bg2)', border:'1px solid var(--border-strong)', borderRadius:16, padding:20, boxShadow:'0 16px 48px rgba(0,0,0,0.35)', width:300 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <span style={{ fontWeight:800, fontSize:14, color:'var(--text)' }}>📅 Date Range</span>
              <button onClick={() => setShowPicker(false)} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:18, lineHeight:1 }}>✕</button>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
              {[{l:'Today',d:0},{l:'7 Days',d:7},{l:'30 Days',d:30},{l:'90 Days',d:90}].map(({l,d}) => (
                <button key={l} onClick={() => quickApply(d)} style={{ padding:'6px 12px', borderRadius:99, border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--text2)', fontSize:12, fontWeight:600, cursor:'pointer' }}>{l}</button>
              ))}
            </div>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>From</label>
            <input type="date" className="input" value={customFrom} max={customTo||todayStr} onChange={e=>setCustomFrom(e.target.value)} style={{ fontSize:14, marginBottom:12, minHeight:44 }} />
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>To</label>
            <input type="date" className="input" value={customTo} min={customFrom} max={todayStr} onChange={e=>setCustomTo(e.target.value)} style={{ fontSize:14, marginBottom:16, minHeight:44 }} />
            <button className="btn btn-primary" onClick={applyCustom} style={{ width:'100%', minHeight:44 }}>Apply</button>
          </div>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && (
        <DateSheet show={showPicker} onClose={() => setShowPicker(false)}
          customFrom={customFrom} customTo={customTo}
          setCustomFrom={setCustomFrom} setCustomTo={setCustomTo}
          todayStr={todayStr} onApply={applyCustom} onQuick={quickApply}
        />
      )}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}><div className="spinner" /></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap: isMobile ? 12 : 18 }}>

          {/* ── LATEST READING ── */}
          {latest && (
            <div className="card" style={{ padding: isMobile ? '20px 18px' : '28px 30px' }}>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text3)', marginBottom:16 }}>Latest Reading</div>

              {/* Big BP numbers */}
              <div style={{ display:'flex', alignItems:'center', gap: isMobile ? 8 : 20, marginBottom:16 }}>
                <div style={{ textAlign:'center', flex:1 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Systolic</div>
                  <div style={{ fontSize: isMobile ? 56 : 72, fontWeight:800, color:'var(--val-sys)', lineHeight:1, letterSpacing:'-0.04em' }}>{latest.systolic}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:4 }}>mmHg</div>
                </div>
                <div style={{ fontSize: isMobile ? 32 : 40, color:'var(--border-strong)', fontWeight:200, lineHeight:1, alignSelf:'center' }}>/</div>
                <div style={{ textAlign:'center', flex:1 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Diastolic</div>
                  <div style={{ fontSize: isMobile ? 44 : 56, fontWeight:700, color:'var(--val-dia)', lineHeight:1, letterSpacing:'-0.03em' }}>{latest.diastolic}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:4 }}>mmHg</div>
                </div>
                {latest.pulse && (
                  <>
                    <div style={{ width:1, height: isMobile ? 60 : 80, background:'var(--border)', flexShrink:0 }} />
                    <div style={{ textAlign:'center', flex:0.8 }}>
                      <div style={{ fontSize:9, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Pulse</div>
                      <div style={{ fontSize: isMobile ? 34 : 44, fontWeight:800, color:'var(--val-pulse)', lineHeight:1, letterSpacing:'-0.03em' }}>{latest.pulse}</div>
                      <div style={{ fontSize:10, color:'var(--text3)', marginTop:4 }}>bpm</div>
                    </div>
                  </>
                )}
              </div>

              {/* Category + timestamp */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                {summary?.totalReadings > 0 && (
                  <span style={{ padding:'6px 14px', borderRadius:8, background:catStyle.bg, border:`1px solid ${catStyle.border}`, color:catStyle.color, fontWeight:700, fontSize:13 }}>{summary.category}</span>
                )}
                <span style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--mono)' }}>{latest.recordedAt}</span>
              </div>
            </div>
          )}

          {/* ── STATS ROW ── */}
          {summary?.totalReadings > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: isMobile ? 8 : 14 }}>
              {[
                { label:'Avg Systolic', value:summary.avgSystolic, unit:'mmHg', sub:`${summary.minSystolic}–${summary.maxSystolic}`, color:'var(--val-sys)' },
                { label:'Avg Diastolic', value:summary.avgDiastolic, unit:'mmHg', sub:`${summary.minDiastolic}–${summary.maxDiastolic}`, color:'var(--val-dia)' },
                { label:'Avg Pulse', value:summary.avgPulse>0?summary.avgPulse:'—', unit:summary.avgPulse>0?'bpm':'', sub:summary.maxPulse>0?`${summary.minPulse}–${summary.maxPulse}`:'', color:'var(--val-pulse)' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: isMobile ? '14px 12px' : '18px 16px' }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text3)', marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontSize: isMobile ? 28 : 34, fontWeight:800, color:s.color, lineHeight:1, letterSpacing:'-0.03em', marginBottom:3 }}>{s.value}</div>
                  <div style={{ fontSize:9, color:'var(--text3)' }}>{s.unit}</div>
                  {s.sub && <div style={{ fontSize:9, color:'var(--text3)', fontFamily:'var(--mono)', marginTop:2 }}>{s.sub}</div>}
                </div>
              ))}
            </div>
          )}

          {/* ── CHART ── */}
          {graphData.length > 0 ? (
            <div className="card" style={{ padding: isMobile ? '18px 12px 18px 6px' : '24px 26px' }}>
              <div style={{ padding: isMobile ? '0 8px' : 0, marginBottom:12 }}>
                <div style={{ fontWeight:800, fontSize: isMobile ? 15 : 18, color:'var(--text)', marginBottom:2 }}>BP Trend</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>{graphData.length} readings · {activeLabel}</div>
              </div>
              <div style={{ display:'flex', gap: isMobile ? 10 : 20, marginBottom:14, paddingLeft: isMobile ? 8 : 0, flexWrap:'wrap' }}>
                {[{c:'#3b82f6',l:'Systolic'},{c:'#06b6d4',l:'Diastolic'},{c:'#a855f7',l:'Pulse',dash:true}].map(item => (
                  <div key={item.l} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:14, height:2, background:item.dash?'transparent':item.c, borderRadius:1, ...(item.dash?{borderTop:`2px dashed ${item.c}`}:{}) }} />
                    <div style={{ width:5, height:5, borderRadius:'50%', background:item.c }} />
                    <span style={{ fontSize:10, color:'var(--text2)', fontWeight:600 }}>{item.l}</span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={isMobile ? 200 : 270}>
                <LineChart data={graphData} margin={{ top:6, right: isMobile?4:20, bottom:4, left: isMobile?-20:-10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.6} />
                  <XAxis dataKey="name" stroke="var(--text3)" tick={{ fontSize: isMobile?8:11, fill:'var(--text3)', fontFamily:'var(--mono)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[50,190]} stroke="var(--text3)" tick={{ fontSize: isMobile?8:11, fill:'var(--text3)', fontFamily:'var(--mono)' }} axisLine={false} tickLine={false} ticks={[60,80,100,120,140,160,180]} width={isMobile?26:35} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={120} stroke="#10b981" strokeDasharray="5 4" strokeOpacity={0.5} strokeWidth={1.5} />
                  <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="5 4" strokeOpacity={0.5} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="systolic" stroke="#3b82f6" strokeWidth={isMobile?2:2.5} dot={{ fill:'#3b82f6', r:isMobile?2:4, strokeWidth:2, stroke:'var(--bg)' }} activeDot={{ r:5 }} name="Systolic" legendType="none" />
                  <Line type="monotone" dataKey="diastolic" stroke="#06b6d4" strokeWidth={isMobile?2:2.5} dot={{ fill:'#06b6d4', r:isMobile?2:4, strokeWidth:2, stroke:'var(--bg)' }} activeDot={{ r:5 }} name="Diastolic" legendType="none" />
                  <Line type="monotone" dataKey="pulse" stroke="#a855f7" strokeWidth={isMobile?1.5:2} strokeDasharray="6 3" dot={{ fill:'#a855f7', r:isMobile?2:3, strokeWidth:2, stroke:'var(--bg)' }} activeDot={{ r:4 }} name="Pulse" legendType="none" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card" style={{ textAlign:'center', padding: isMobile ? '48px 20px' : '72px 32px' }}>
              <div style={{ fontSize:48, marginBottom:14 }}>📊</div>
              <div style={{ fontWeight:800, fontSize: isMobile ? 17 : 20, color:'var(--text)', marginBottom:8 }}>No data for {activeLabel}</div>
              <div style={{ color:'var(--text3)', marginBottom:20, fontSize:14 }}>Log a reading to start tracking</div>
              <button className="btn btn-primary" onClick={() => navigate('/log')} style={{ minWidth:180 }}>+ Log Reading</button>
            </div>
          )}

          {/* ── INSIGHT ── */}
          {summary?.totalReadings > 0 && (
            <div className="card" style={{ borderLeft:`3px solid ${catStyle.color||'var(--accent)'}`, padding: isMobile ? '16px 16px' : '22px 24px' }}>
              <div style={{ fontWeight:800, fontSize: isMobile ? 14 : 15, color:'var(--text)', marginBottom:8 }}>💡 Health Insight</div>
              <p style={{ color:'var(--text2)', lineHeight:1.7, fontSize: isMobile ? 14 : 14, margin:0 }}>{summary.suggestion}</p>
              {summary.alerts?.length > 0 && (
                <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:6 }}>
                  {summary.alerts.map((alert,i) => (
                    <div key={i} style={{ background:'var(--red-dim)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'9px 12px', color:'var(--red)', fontSize:12, fontWeight:500 }}>⚠️ {alert}</div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <button onClick={() => navigate('/log')} style={{
          position:'fixed', bottom:'calc(env(safe-area-inset-bottom, 0px) + 76px)', right:18,
          zIndex:100, width:56, height:56, borderRadius:'50%',
          background:'var(--btn-bg)', border:'none', cursor:'pointer',
          boxShadow:'0 6px 24px rgba(99,102,241,0.55)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:24, color:'#fff',
        }}>➕</button>
      )}
    </div>
  );
}