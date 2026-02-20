import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { readingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCategoryStyle, RANGES } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ label, value, unit, sub, colorVar }) => (
  <div className="card" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', fontFamily: 'var(--font-display)' }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
      <span className="stat-value" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: colorVar, fontFamily: 'var(--font-display)' }}>{value ?? '—'}</span>
      {unit && <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500 }}>{unit}</span>}
    </div>
    {sub && <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{sub}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: '10px 14px', fontSize: 11, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
      <div style={{ color: 'var(--text2)', marginBottom: 6, fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 3, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />
            <span style={{ color: 'var(--text2)', fontSize: 10 }}>{p.name}</span>
          </div>
          <strong style={{ fontFamily: 'var(--font-mono)', color: p.color, fontSize: 12 }}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const toInputDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const fmtDate = (s) => {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/* ── Mobile bottom sheet date picker ── */
const MobileDateModal = ({ show, onClose, customFrom, customTo, setCustomFrom, setCustomTo, todayStr, onApply, onQuickApply }) => {
  if (!show) return null;
  const fmtD = (s) => { if (!s) return '—'; const [y,m,d]=s.split('-'); return new Date(+y,+m-1,+d).toLocaleDateString('en-IN',{day:'numeric',month:'short'}); };
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001, background: 'var(--bg3)', borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,0.5)', maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '12px auto 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 0' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>📅 Date Range</div>
          <button onClick={onClose} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text3)', fontSize: 15, fontFamily: 'inherit' }}>✕</button>
        </div>
        <div style={{ padding: '14px 18px max(env(safe-area-inset-bottom, 22px), 22px)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Quick Select</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
            {[{l:'Today',d:0},{l:'7 Days',d:7},{l:'14 Days',d:14},{l:'30 Days',d:30},{l:'3 Months',d:90},{l:'6 Months',d:180}].map(({l,d}) => (
              <button key={l} onClick={() => onQuickApply(d)} style={{ padding: '10px 6px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text2)', fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Or pick dates</div>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>From</label>
          <input type="date" className="input" value={customFrom} max={customTo || todayStr} onChange={e => setCustomFrom(e.target.value)} style={{ width: '100%', fontSize: 15, padding: '12px 14px', marginBottom: 12 }} />
          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>To</label>
          <input type="date" className="input" value={customTo} min={customFrom} max={todayStr} onChange={e => setCustomTo(e.target.value)} style={{ width: '100%', fontSize: 15, padding: '12px 14px' }} />
          {customFrom && customTo && (
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card)', borderRadius: 10, padding: '10px 14px', margin: '14px 0', gap: 8 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>From</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{fmtD(customFrom)}</div>
              </div>
              <div style={{ color: 'var(--text3)', fontSize: 14 }}>→</div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>To</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{fmtD(customTo)}</div>
              </div>
            </div>
          )}
          <button className="btn btn-primary" onClick={onApply} disabled={!customFrom || !customTo} style={{ width: '100%', padding: '14px', fontSize: 15, opacity: (!customFrom || !customTo) ? 0.4 : 1, marginTop: 4 }}>
            Apply Range
          </button>
        </div>
      </div>
    </>
  );
};

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
  const [latestReading, setLatestReading] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [customFrom, setCustomFrom] = useState(todayStr);
  const [customTo, setCustomTo] = useState(todayStr);
  const [isCustom, setIsCustom] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (isMobile) return;
    const fn = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false); };
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
        const todayDate = new Date().toISOString().slice(0, 10);
        data = data.filter(p => {
          const pointDate = (p.timestamp || p.timeLabel || '').slice(0, 10);
          return pointDate === todayDate || !pointDate;
        });
      }
      setGraphData(data);
      setSummary(sRes.data);
      if (aRes.data.length > 0) setLatestReading(aRes.data[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [range, isCustom, customFrom, customTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const applyCustom = () => {
    if (customFrom && customTo) { setIsCustom(true); setShowPicker(false); }
  };
  const clearCustom = (e) => {
    e.stopPropagation();
    setIsCustom(false); setRange('today'); setCustomFrom(todayStr); setCustomTo(todayStr);
  };
  const clickRange = (v) => { setRange(v); setIsCustom(false); setShowPicker(false); };

  // Single quickApply used by BOTH web dropdown chips AND mobile grid
  // Sets dates and immediately applies — no extra button press needed
  const quickApply = (days) => {
    const to = new Date(), from = new Date();
    if (days > 0) from.setDate(from.getDate() - days);
    setCustomFrom(toInputDate(from));
    setCustomTo(toInputDate(to));
    setIsCustom(true);
    setShowPicker(false);
  };

  const catStyle = summary ? getCategoryStyle(summary.category) : {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const activeLabel = isCustom
    ? (customFrom === customTo ? fmtDate(customFrom) : `${fmtDate(customFrom)}–${fmtDate(customTo)}`)
    : RANGES.find(r => r.value === range)?.label;

  const fA = { padding: '8px 15px', borderRadius: 99, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, border: 'none', background: 'var(--btn-primary-bg)', color: '#fff', boxShadow: 'var(--btn-primary-shadow)', transition: 'all 0.2s', flexShrink: 0, whiteSpace: 'nowrap' };
  const fI = { padding: '8px 15px', borderRadius: 99, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text2)', transition: 'all 0.2s', flexShrink: 0, whiteSpace: 'nowrap' };

  return (
    <div className="fade-in">

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMobile ? 14 : 28, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 3 }}>{greeting} 👋</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {user?.fullName || user?.username}'s Dashboard
          </h1>
        </div>
        {!isMobile && (
          <button className="btn btn-primary" onClick={() => navigate('/log')} style={{ fontSize: 13, padding: '11px 22px' }}>+ Log Reading</button>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: isMobile ? 14 : 24, overflowX: 'auto', paddingBottom: 6, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {RANGES.slice(0, 5).map(r => (
          <button key={r.value} onClick={() => clickRange(r.value)} style={!isCustom && range === r.value ? fA : fI}>{r.label}</button>
        ))}
        <div ref={pickerRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowPicker(v => !v)} style={{ ...(isCustom ? fA : fI), display: 'flex', alignItems: 'center', gap: 5 }}>
            📅 {isCustom ? activeLabel : 'Custom'}
          </button>
          {isCustom && (
            <button onClick={clearCustom} style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: 8, cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>✕</button>
          )}
          {/* WEB desktop dropdown only */}
          {!isMobile && showPicker && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 300, background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: 18, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', width: 290 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>📅 Select Date Range</div>
                <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>From</label>
                  <input type="date" className="input" value={customFrom} max={customTo || todayStr} onChange={e => setCustomFrom(e.target.value)} style={{ fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>To</label>
                  <input type="date" className="input" value={customTo} min={customFrom} max={todayStr} onChange={e => setCustomTo(e.target.value)} style={{ fontSize: 13 }} />
                </div>
                {/* FIXED: chips call quickApply — immediately applies, no extra button needed */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {[{l:'Today',d:0},{l:'7 Days',d:7},{l:'14 Days',d:14},{l:'30 Days',d:30},{l:'90 Days',d:90}].map(({l,d}) => (
                    <button key={l} onClick={() => quickApply(d)} style={{ padding: '5px 10px', borderRadius: 99, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer' }}>{l}</button>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={applyCustom} style={{ width: '100%', padding: '10px', fontSize: 13 }}>Apply Range</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && (
        <MobileDateModal
          show={showPicker}
          onClose={() => setShowPicker(false)}
          customFrom={customFrom}
          customTo={customTo}
          setCustomFrom={setCustomFrom}
          setCustomTo={setCustomTo}
          todayStr={todayStr}
          onApply={applyCustom}
          onQuickApply={quickApply}
        />
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 16 }}>

          {latestReading && (
            isMobile ? (
              /* MOBILE: compact card with inner bg panel */
              <div className="card" style={{ padding: '14px' }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>Latest Reading</div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 11, padding: '11px 10px', marginBottom: 11 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>SYS</div>
                    <span style={{ fontSize: 42, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--val-sys)', lineHeight: 1, letterSpacing: '-0.04em' }}>{latestReading.systolic}</span>
                    <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>mmHg</div>
                  </div>
                  <span style={{ fontSize: 20, color: 'var(--text3)', fontWeight: 200 }}>/</span>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>DIA</div>
                    <span style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--val-dia)', letterSpacing: '-0.03em', lineHeight: 1 }}>{latestReading.diastolic}</span>
                    <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>mmHg</div>
                  </div>
                  {latestReading.pulse && (
                    <>
                      <div style={{ width: 1, height: 40, background: 'var(--border)', margin: '0 8px' }} />
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>PULSE</div>
                        <span style={{ fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--val-pulse)', lineHeight: 1 }}>{latestReading.pulse}</span>
                        <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>bpm</div>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  {summary && summary.totalReadings > 0 && (
                    <span style={{ padding: '4px 12px', borderRadius: 7, background: catStyle.bg, border: `1px solid ${catStyle.border}`, color: catStyle.color, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12 }}>{summary.category}</span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{latestReading.recordedAt}</span>
                </div>
              </div>
            ) : (
              /* WEB: unchanged large card */
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '26px 28px' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>Latest Reading</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 8 }}>
                      <span style={{ fontSize: 58, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--val-sys)', lineHeight: 1, letterSpacing: '-0.04em' }}>{latestReading.systolic}</span>
                      <span style={{ fontSize: 28, color: 'var(--text3)', fontWeight: 300, lineHeight: 1 }}>/</span>
                      <span style={{ fontSize: 42, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--val-dia)', letterSpacing: '-0.03em', lineHeight: 1 }}>{latestReading.diastolic}</span>
                      <span style={{ fontSize: 13, color: 'var(--text3)', marginLeft: 4 }}>mmHg</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {latestReading.pulse && <span style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5 }}>❤️ <strong style={{ color: 'var(--val-pulse)', fontFamily: 'var(--font-display)' }}>{latestReading.pulse}</strong> bpm</span>}
                      <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{latestReading.recordedAt}</span>
                    </div>
                  </div>
                </div>
                {summary && summary.totalReadings > 0 && (
                  <div className="card" style={{ padding: '26px 24px' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 14 }}>Status</div>
                    <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 8, background: catStyle.bg, border: `1px solid ${catStyle.border}`, color: catStyle.color, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{summary.category}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 8 }}>{summary.trend}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{summary.totalReadings} reading{summary.totalReadings !== 1 ? 's' : ''}</div>
                  </div>
                )}
              </div>
            )
          )}

          {summary && summary.totalReadings > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: isMobile ? 7 : 14 }}>
              <StatCard label="Avg Systolic" value={summary.avgSystolic} unit="mmHg" sub={`${summary.minSystolic}–${summary.maxSystolic}`} colorVar="var(--val-sys)" />
              <StatCard label="Avg Diastolic" value={summary.avgDiastolic} unit="mmHg" sub={`${summary.minDiastolic}–${summary.maxDiastolic}`} colorVar="var(--val-dia)" />
              <StatCard label="Avg Pulse" value={summary.avgPulse > 0 ? summary.avgPulse : '—'} unit={summary.avgPulse > 0 ? 'bpm' : ''} sub={summary.maxPulse > 0 ? `${summary.minPulse}–${summary.maxPulse}` : '—'} colorVar="var(--val-pulse)" />
            </div>
          )}

          {graphData.length > 0 ? (
            <div className="card" style={{ padding: isMobile ? '14px 10px' : '24px 26px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 13 : 16, color: 'var(--text)', marginBottom: 4 }}>BP Trend</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 10 }}>{graphData.length} data points · {activeLabel}</div>
              <div style={{ display: 'flex', gap: isMobile ? 8 : 18, marginBottom: isMobile ? 10 : 16, flexWrap: 'wrap' }}>
                {[{color:'#3b82f6',label:'Systolic'},{color:'#06b6d4',label:'Diastolic'},{color:'#a855f7',label:'Pulse',dash:true}].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 14, height: 2, background: l.dash ? 'transparent' : l.color, borderRadius: 1, ...(l.dash ? { borderTop: `2px dashed ${l.color}` } : {}) }} />
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: l.color }} />
                    <span style={{ fontSize: 10, color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={isMobile ? 185 : 260}>
                <LineChart data={graphData} margin={{ top: 6, right: isMobile ? 6 : 20, bottom: 4, left: isMobile ? -22 : -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.6} />
                  <XAxis dataKey="name" stroke="var(--text3)" tick={{ fontSize: isMobile ? 8 : 11, fill: 'var(--text3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[50, 190]} stroke="var(--text3)" tick={{ fontSize: isMobile ? 8 : 11, fill: 'var(--text3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} ticks={[60,80,100,120,140,160,180]} width={isMobile ? 26 : 35} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={120} stroke="#10b981" strokeDasharray="5 4" strokeOpacity={0.6} strokeWidth={1.5} />
                  <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="5 4" strokeOpacity={0.6} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="systolic" stroke="#3b82f6" strokeWidth={isMobile?2:2.5} dot={{ fill:'#3b82f6', r:isMobile?2:4, strokeWidth:2, stroke:'var(--card)' }} activeDot={{ r:5, stroke:'#3b82f6', strokeWidth:2, fill:'var(--card)' }} name="Systolic" legendType="none" />
                  <Line type="monotone" dataKey="diastolic" stroke="#06b6d4" strokeWidth={isMobile?2:2.5} dot={{ fill:'#06b6d4', r:isMobile?2:4, strokeWidth:2, stroke:'var(--card)' }} activeDot={{ r:5, stroke:'#06b6d4', strokeWidth:2, fill:'var(--card)' }} name="Diastolic" legendType="none" />
                  <Line type="monotone" dataKey="pulse" stroke="#a855f7" strokeWidth={isMobile?1.5:2} strokeDasharray="6 3" dot={{ fill:'#a855f7', r:isMobile?2:3, strokeWidth:2, stroke:'var(--card)' }} activeDot={{ r:4, stroke:'#a855f7', strokeWidth:2, fill:'var(--card)' }} name="Pulse" legendType="none" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: isMobile ? '40px 16px' : '64px 24px' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 14 : 17, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>No readings for {activeLabel}</div>
              <div style={{ color: 'var(--text3)', marginBottom: 18, fontSize: 12 }}>Log your first reading to see trends</div>
              <button className="btn btn-primary" onClick={() => navigate('/log')}>+ Log Reading</button>
            </div>
          )}

          {summary && summary.totalReadings > 0 && (
            <div className="card" style={{ borderLeft: `3px solid ${catStyle.color || 'var(--accent)'}`, padding: isMobile ? '14px 12px' : '22px 24px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? 13 : 14, color: 'var(--text)', marginBottom: 6 }}>💡 Health Insight</div>
              <p style={{ color: 'var(--text2)', lineHeight: 1.65, fontSize: isMobile ? 13 : 14, margin: 0 }}>{summary.suggestion}</p>
              {summary.alerts?.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {summary.alerts.map((alert, i) => (
                    <div key={i} style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, padding: '7px 10px', color: 'var(--red)', fontSize: 11, fontWeight: 500 }}>⚠️ {alert}</div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {isMobile && (
        <button onClick={() => navigate('/log')} style={{ position: 'fixed', bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 8px) + 62px)', right: 16, zIndex: 90, width: 52, height: 52, borderRadius: '50%', background: 'var(--btn-primary-bg)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(99,102,241,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff' }}>
          ➕
        </button>
      )}

    </div>
  );
}