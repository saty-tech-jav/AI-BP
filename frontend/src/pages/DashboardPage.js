import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { readingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCategoryStyle, RANGES } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

/* ─── Stat Card ─── */
const StatCard = ({ label, value, unit, sub, colorVar }) => (
  <div className="card" style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
      color: 'var(--text3)', fontFamily: 'var(--font-display)',
    }}>
      {label}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <span style={{
        fontSize: 38, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em',
        color: colorVar, fontFamily: 'var(--font-display)',
      }}>
        {value ?? '—'}
      </span>
      {unit && <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{unit}</span>}
    </div>
    {sub && (
      <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{sub}</div>
    )}
  </div>
);

/* ─── Tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border-strong)',
      borderRadius: 10, padding: '12px 16px', fontSize: 13,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    }}>
      <div style={{ color: 'var(--text2)', marginBottom: 8, fontWeight: 700, fontSize: 12 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 3, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: 'var(--text2)', fontSize: 12 }}>{p.name}</span>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ─── Helpers ─── */
const toInputDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const fmtDate = (s) => {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return new Date(+y, +m - 1, +d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const todayStr  = toInputDate(new Date());

  const [range,          setRange]          = useState('today');
  const [graphData,      setGraphData]      = useState([]);
  const [summary,        setSummary]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [latestReading,  setLatestReading]  = useState(null);
  const [showPicker,     setShowPicker]     = useState(false);
  const [customFrom,     setCustomFrom]     = useState(todayStr);
  const [customTo,       setCustomTo]       = useState(todayStr);
  const [isCustom,       setIsCustom]       = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, sRes, aRes] = await Promise.all([
        isCustom ? readingsAPI.getGraphCustom(customFrom, customTo)   : readingsAPI.getGraph(range),
        isCustom ? readingsAPI.getSummaryCustom(customFrom, customTo) : readingsAPI.getSummary(range),
        readingsAPI.getAll(),
      ]);
      setGraphData(gRes.data.map(p => ({ ...p, name: p.timeLabel || p.timestamp })));
      setSummary(sRes.data);
      if (aRes.data.length > 0) setLatestReading(aRes.data[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [range, isCustom, customFrom, customTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const applyCustom   = () => { if (customFrom && customTo) { setIsCustom(true); setShowPicker(false); } };
  const clearCustom   = (e) => { e.stopPropagation(); setIsCustom(false); setRange('today'); setCustomFrom(todayStr); setCustomTo(todayStr); };
  const clickRange    = (v) => { setRange(v); setIsCustom(false); setShowPicker(false); };
  const quickSelect   = (days) => {
    const to = new Date(), from = new Date();
    if (days > 0) from.setDate(from.getDate() - days);
    setCustomFrom(toInputDate(from)); setCustomTo(toInputDate(to));
  };

  const catStyle  = summary ? getCategoryStyle(summary.category) : {};
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const activeLabel = isCustom
    ? (customFrom === customTo ? fmtDate(customFrom) : `${fmtDate(customFrom)} – ${fmtDate(customTo)}`)
    : RANGES.find(r => r.value === range)?.label;

  /* ─── Filter button styles ─── */
  const filterActive = {
    padding: '7px 16px', borderRadius: 99, cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
    border: 'none', background: 'var(--btn-primary-bg)',
    color: '#fff', boxShadow: 'var(--btn-primary-shadow)',
    transition: 'all 0.2s', letterSpacing: '0.01em',
  };
  const filterInactive = {
    padding: '7px 16px', borderRadius: 99, cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
    border: '1px solid var(--border)', background: 'var(--card)',
    color: 'var(--text2)', boxShadow: 'none', transition: 'all 0.2s',
    letterSpacing: '0.01em',
  };

  return (
    <div className="fade-in">

      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 5 }}>
            {greeting} 👋
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {user?.fullName || user?.username}'s Dashboard
          </h1>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/log')} style={{ fontSize: 13, padding: '11px 22px' }}>
          + Log Reading
        </button>
      </div>

      {/* ─── Filters ─── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
        {RANGES.map(r => (
          <button key={r.value} onClick={() => clickRange(r.value)}
            style={!isCustom && range === r.value ? filterActive : filterInactive}>
            {r.label}
          </button>
        ))}

        {/* Custom Range */}
        <div style={{ position: 'relative' }} ref={pickerRef}>
          <button onClick={() => setShowPicker(v => !v)}
            style={isCustom ? { ...filterActive, display: 'flex', alignItems: 'center', gap: 6 }
                            : { ...filterInactive, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {isCustom ? activeLabel : 'Custom Range'}
          </button>

          {isCustom && (
            <button onClick={clearCustom} style={{
              position: 'absolute', top: -5, right: -5, width: 17, height: 17,
              borderRadius: '50%', background: 'var(--red)', border: 'none',
              color: '#fff', fontSize: 9, cursor: 'pointer', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
            }}>✕</button>
          )}

          {showPicker && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 10px)', left: 0, zIndex: 200,
              background: 'var(--card)', border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius)', padding: 20,
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)', minWidth: 290,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--text)', marginBottom: 16 }}>
                📅 Select Date Range
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* From */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>From</label>
                  <input type="date" className="input" value={customFrom} max={customTo}
                    onChange={e => setCustomFrom(e.target.value)} style={{ fontSize: 13 }} />
                </div>
                {/* To */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>To</label>
                  <input type="date" className="input" value={customTo} min={customFrom} max={todayStr}
                    onChange={e => setCustomTo(e.target.value)} style={{ fontSize: 13 }} />
                </div>
                {/* Quick select */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Quick Select</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {[{ l: 'Today', d: 0 },{ l: '3 Days', d: 3 },{ l: '5 Days', d: 5 },
                      { l: '10 Days', d: 10 },{ l: '15 Days', d: 15 },{ l: '45 Days', d: 45 }].map(({ l, d }) => (
                      <button key={l} onClick={() => quickSelect(d)} style={{
                        padding: '5px 11px', borderRadius: 99, border: '1px solid var(--border)',
                        background: 'var(--bg3)', color: 'var(--text2)',
                        fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Apply */}
                <button className="btn btn-primary" onClick={applyCustom}
                  disabled={!customFrom || !customTo}
                  style={{ width: '100%', padding: '11px', fontSize: 13, opacity: (!customFrom || !customTo) ? 0.4 : 1 }}>
                  Apply Range
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Content ─── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Row 1 — Latest + Status */}
          {latestReading && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>

              {/* Latest Reading */}
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '26px 28px' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>
                    Latest Reading
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 8 }}>
                    <span style={{ fontSize: 58, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--val-sys)', lineHeight: 1, letterSpacing: '-0.04em' }}>
                      {latestReading.systolic}
                    </span>
                    <span style={{ fontSize: 28, color: 'var(--text3)', fontWeight: 300, lineHeight: 1 }}>/</span>
                    <span style={{ fontSize: 42, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--val-dia)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {latestReading.diastolic}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text3)', marginLeft: 4 }}>mmHg</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {latestReading.pulse && (
                      <span style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        ❤️ <strong style={{ color: 'var(--val-pulse)', fontFamily: 'var(--font-display)' }}>{latestReading.pulse}</strong> bpm
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                      {latestReading.recordedAt}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              {summary && summary.totalReadings > 0 && (
                <div className="card" style={{ padding: '26px 24px' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 14 }}>
                    Status
                  </div>
                  <div style={{
                    display: 'inline-block', padding: '6px 14px', borderRadius: 8,
                    background: catStyle.bg, border: `1px solid ${catStyle.border}`,
                    color: catStyle.color, fontFamily: 'var(--font-display)',
                    fontWeight: 700, fontSize: 14, marginBottom: 14,
                  }}>
                    {summary.category}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 8 }}>{summary.trend}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    {summary.totalReadings} reading{summary.totalReadings !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Row 2 — Stat Cards */}
          {summary && summary.totalReadings > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <StatCard label="Avg Systolic"  value={summary.avgSystolic}                        unit="mmHg" sub={`${summary.minSystolic} – ${summary.maxSystolic}`}   colorVar="var(--val-sys)" />
              <StatCard label="Avg Diastolic" value={summary.avgDiastolic}                       unit="mmHg" sub={`${summary.minDiastolic} – ${summary.maxDiastolic}`} colorVar="var(--val-dia)" />
              <StatCard label="Avg Pulse"     value={summary.avgPulse > 0 ? summary.avgPulse : '—'} unit={summary.avgPulse > 0 ? 'bpm' : ''} sub={summary.maxPulse > 0 ? `${summary.minPulse} – ${summary.maxPulse}` : '—'} colorVar="var(--val-pulse)" />
            </div>
          )}

          {/* Row 3 — Chart */}
          {graphData.length > 0 ? (
            <div className="card" style={{ padding: '24px 26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                  BP Trend
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  {activeLabel}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={graphData} margin={{ top: 5, right: 16, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text3)" tick={{ fontSize: 11, fill: 'var(--text3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 180]} stroke="var(--text3)" tick={{ fontSize: 11, fill: 'var(--text3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 600, paddingTop: 12 }} />
                  <ReferenceLine y={120} stroke="var(--green)"  strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: 'Normal', fill: 'var(--green)',  fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                  <ReferenceLine y={140} stroke="var(--red)"    strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: 'High',   fill: 'var(--red)',    fontSize: 10, fontFamily: 'var(--font-mono)' }} />
                  <Line type="monotone" dataKey="systolic"  stroke="var(--val-sys)"   strokeWidth={2.5} dot={{ fill: 'var(--val-sys)',   r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} name="Systolic" />
                  <Line type="monotone" dataKey="diastolic" stroke="var(--val-dia)"   strokeWidth={2.5} dot={{ fill: 'var(--val-dia)',   r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} name="Diastolic" />
                  <Line type="monotone" dataKey="pulse"     stroke="var(--val-pulse)" strokeWidth={2}   dot={{ fill: 'var(--val-pulse)', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} name="Pulse" strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>📊</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.01em' }}>
                No readings found
              </div>
              <div style={{ color: 'var(--text3)', marginBottom: 22, fontSize: 14 }}>
                Log your first reading to see trends and analysis
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/log')}>+ Log First Reading</button>
            </div>
          )}

          {/* Row 4 — Health Insight */}
          {summary && summary.totalReadings > 0 && (
            <div className="card" style={{ borderLeft: `3px solid ${catStyle.color || 'var(--accent)'}`, padding: '22px 24px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 10, letterSpacing: '-0.01em' }}>
                💡 Health Insight
              </div>
              <p style={{ color: 'var(--text2)', lineHeight: 1.75, fontSize: 14 }}>{summary.suggestion}</p>
              {summary.alerts?.length > 0 && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {summary.alerts.map((alert, i) => (
                    <div key={i} style={{
                      background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 8, padding: '9px 14px', color: 'var(--red)', fontSize: 13, fontWeight: 500,
                    }}>
                      ⚠️ {alert}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}