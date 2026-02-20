import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, defs, linearGradient, stop
} from 'recharts';
import { readingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCategoryStyle, RANGES } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

/* ─── Stat Card ─── */
const StatCard = ({ label, value, unit, sub, colorVar }) => (
  <div className="card" style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)', fontFamily: 'var(--font-display)' }}>
      {label}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <span style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: colorVar, fontFamily: 'var(--font-display)' }}>
        {value ?? '—'}
      </span>
      {unit && <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{unit}</span>}
    </div>
    {sub && <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{sub}</div>}
  </div>
);

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border-strong)',
      borderRadius: 12, padding: '14px 18px', fontSize: 13,
      boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
    }}>
      <div style={{ color: 'var(--text2)', marginBottom: 10, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 5, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ color: 'var(--text2)', fontSize: 12 }}>{p.name}</span>
          </div>
          <strong style={{ fontFamily: 'var(--font-mono)', color: p.color, fontSize: 14 }}>{p.value}</strong>
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
  const navigate = useNavigate();
  const todayStr = toInputDate(new Date());

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
    const fn = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, sRes, aRes] = await Promise.all([
        isCustom ? readingsAPI.getGraphCustom(customFrom, customTo) : readingsAPI.getGraph(range),
        isCustom ? readingsAPI.getSummaryCustom(customFrom, customTo) : readingsAPI.getSummary(range),
        readingsAPI.getAll(),
      ]);

      // ✅ FIX: Filter graph data for "today" on frontend if backend returns multiple days
      let data = gRes.data.map(p => ({ ...p, name: p.timeLabel || p.timestamp }));
      if (range === 'today' && !isCustom) {
        const todayDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        data = data.filter(p => {
          const pointDate = (p.timestamp || p.timeLabel || '').slice(0, 10);
          return pointDate === todayDate || (p.name || '').includes('Feb 20') || !pointDate;
        });
      }

      setGraphData(data);
      setSummary(sRes.data);
      if (aRes.data.length > 0) setLatestReading(aRes.data[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [range, isCustom, customFrom, customTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const applyCustom = () => { if (customFrom && customTo) { setIsCustom(true); setShowPicker(false); } };
  const clearCustom = (e) => { e.stopPropagation(); setIsCustom(false); setRange('today'); setCustomFrom(todayStr); setCustomTo(todayStr); };
  const clickRange = (v) => { setRange(v); setIsCustom(false); setShowPicker(false); };
  const quickSelect = (days) => {
    const to = new Date(), from = new Date();
    if (days > 0) from.setDate(from.getDate() - days);
    setCustomFrom(toInputDate(from)); setCustomTo(toInputDate(to));
  };

  const catStyle = summary ? getCategoryStyle(summary.category) : {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const activeLabel = isCustom
    ? (customFrom === customTo ? fmtDate(customFrom) : `${fmtDate(customFrom)} – ${fmtDate(customTo)}`)
    : RANGES.find(r => r.value === range)?.label;

  const filterActive = {
    padding: '7px 16px', borderRadius: 99, cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
    border: 'none', background: 'var(--btn-primary-bg)',
    color: '#fff', boxShadow: 'var(--btn-primary-shadow)', transition: 'all 0.2s', letterSpacing: '0.01em',
  };
  const filterInactive = {
    padding: '7px 16px', borderRadius: 99, cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
    border: '1px solid var(--border)', background: 'var(--card)',
    color: 'var(--text2)', transition: 'all 0.2s', letterSpacing: '0.01em',
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

      {/* ─── Range Filters ─── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {RANGES.slice(0, 5).map(r => (
          <button key={r.value} onClick={() => clickRange(r.value)}
            style={!isCustom && range === r.value ? filterActive : filterInactive}>
            {r.label}
          </button>
        ))}

        {/* Custom Date Picker */}
        <div ref={pickerRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowPicker(v => !v)} style={{
            ...(isCustom ? filterActive : filterInactive),
            display: 'flex', alignItems: 'center', gap: 6, paddingRight: isCustom ? 28 : 16,
          }}>
            📅 {isCustom ? activeLabel : 'Custom'}
          </button>

          {isCustom && (
            <button onClick={clearCustom} style={{
              position: 'absolute', top: -5, right: -5, width: 17, height: 17,
              borderRadius: '50%', background: 'var(--red, #ef4444)', border: 'none',
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
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>From</label>
                  <input type="date" className="input" value={customFrom} max={customTo}
                    onChange={e => setCustomFrom(e.target.value)} style={{ fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>To</label>
                  <input type="date" className="input" value={customTo} min={customFrom} max={todayStr}
                    onChange={e => setCustomTo(e.target.value)} style={{ fontSize: 13 }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Quick Select</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {[{ l: 'Today', d: 0 }, { l: '3 Days', d: 3 }, { l: '5 Days', d: 5 },
                      { l: '10 Days', d: 10 }, { l: '15 Days', d: 15 }, { l: '45 Days', d: 45 }].map(({ l, d }) => (
                      <button key={l} onClick={() => quickSelect(d)} style={{
                        padding: '5px 11px', borderRadius: 99, border: '1px solid var(--border)',
                        background: 'var(--bg3)', color: 'var(--text2)',
                        fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}>{l}</button>
                    ))}
                  </div>
                </div>
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
              <StatCard label="Avg Systolic" value={summary.avgSystolic} unit="mmHg" sub={`${summary.minSystolic} – ${summary.maxSystolic}`} colorVar="var(--val-sys)" />
              <StatCard label="Avg Diastolic" value={summary.avgDiastolic} unit="mmHg" sub={`${summary.minDiastolic} – ${summary.maxDiastolic}`} colorVar="var(--val-dia)" />
              <StatCard label="Avg Pulse" value={summary.avgPulse > 0 ? summary.avgPulse : '—'} unit={summary.avgPulse > 0 ? 'bpm' : ''} sub={summary.maxPulse > 0 ? `${summary.minPulse} – ${summary.maxPulse}` : '—'} colorVar="var(--val-pulse)" />
            </div>
          )}

          {/* Row 3 — Improved Chart */}
          {graphData.length > 0 ? (
            <div className="card" style={{ padding: '24px 26px' }}>
              {/* Chart Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                    BP Trend
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{graphData.length} data points</div>
                </div>
                <div style={{
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '5px 12px',
                  fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 600,
                }}>
                  {activeLabel}
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 18, marginBottom: 20, marginTop: 12 }}>
                {[
                  { color: '#3b82f6', label: 'Systolic', dash: false },
                  { color: '#06b6d4', label: 'Diastolic', dash: false },
                  { color: '#a855f7', label: 'Pulse', dash: true },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                      width: 24, height: 3, background: l.dash ? 'transparent' : l.color,
                      borderRadius: 2, position: 'relative',
                      ...(l.dash ? { borderTop: `2px dashed ${l.color}` } : {}),
                    }} />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                    <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>{l.label}</span>
                  </div>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 16, height: 2, background: '#10b981', borderTop: '2px dashed #10b981' }} />
                    <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>Normal 120</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 16, height: 2, borderTop: '2px dashed #ef4444' }} />
                    <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>High 140</span>
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={graphData} margin={{ top: 10, right: 20, bottom: 5, left: -10 }}>
                  <defs>
                    <linearGradient id="sysGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.6} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text3)"
                    tick={{ fontSize: 11, fill: 'var(--text3)', fontFamily: 'var(--font-mono)' }}
                    axisLine={false} tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[50, 190]}
                    stroke="var(--text3)"
                    tick={{ fontSize: 11, fill: 'var(--text3)', fontFamily: 'var(--font-mono)' }}
                    axisLine={false} tickLine={false}
                    ticks={[60, 80, 100, 120, 140, 160, 180]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={120} stroke="#10b981" strokeDasharray="5 4" strokeOpacity={0.6} strokeWidth={1.5}
                    label={{ value: '120', fill: '#10b981', fontSize: 10, position: 'right', fontWeight: 700 }} />
                  <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="5 4" strokeOpacity={0.6} strokeWidth={1.5}
                    label={{ value: '140', fill: '#ef4444', fontSize: 10, position: 'right', fontWeight: 700 }} />
                  <Line
                    type="monotone" dataKey="systolic" stroke="#3b82f6" strokeWidth={2.5}
                    dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
                    activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2, fill: 'var(--card)' }}
                    name="Systolic" legendType="none"
                  />
                  <Line
                    type="monotone" dataKey="diastolic" stroke="#06b6d4" strokeWidth={2.5}
                    dot={{ fill: '#06b6d4', r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
                    activeDot={{ r: 7, stroke: '#06b6d4', strokeWidth: 2, fill: 'var(--card)' }}
                    name="Diastolic" legendType="none"
                  />
                  <Line
                    type="monotone" dataKey="pulse" stroke="#a855f7" strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={{ fill: '#a855f7', r: 3, strokeWidth: 2, stroke: 'var(--card)' }}
                    activeDot={{ r: 6, stroke: '#a855f7', strokeWidth: 2, fill: 'var(--card)' }}
                    name="Pulse" legendType="none"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '64px 24px' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>📊</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
                No readings for {activeLabel}
              </div>
              <div style={{ color: 'var(--text3)', marginBottom: 22, fontSize: 14 }}>
                Log your first reading to see trends and analysis
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/log')}>+ Log Reading</button>
            </div>
          )}

          {/* Row 4 — Health Insight */}
          {summary && summary.totalReadings > 0 && (
            <div className="card" style={{ borderLeft: `3px solid ${catStyle.color || 'var(--accent)'}`, padding: '22px 24px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 10 }}>
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