import React, { useState, useEffect, useRef } from 'react';
import { readingsAPI } from '../services/api';
import { getCategoryStyle, RANGES } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    const fn = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [readRes, sumRes] = await Promise.all([
        isCustom
          ? readingsAPI.getByCustomRange(customFrom, customTo)
          : range === 'all' ? readingsAPI.getAll() : readingsAPI.getByRange(range),
        isCustom
          ? readingsAPI.getSummaryCustom(customFrom, customTo)
          : readingsAPI.getSummary(range === 'all' ? 'all' : range),
      ]);
      setReadings(readRes.data);
      setSummary(sumRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [range, isCustom, customFrom, customTo]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reading?')) return;
    setDeleting(id);
    try {
      await readingsAPI.delete(id);
      setReadings(r => r.filter(x => x.id !== id));
    } catch (e) { alert('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const applyCustom = () => { if (customFrom && customTo) { setIsCustom(true); setShowPicker(false); } };
  const clearCustom = (e) => { e.stopPropagation(); setIsCustom(false); setRange('today'); setCustomFrom(todayStr); setCustomTo(todayStr); };
  const clickRange = (v) => { setRange(v); setIsCustom(false); setShowPicker(false); };
  const quickSelect = (days) => {
    const to = new Date(), from = new Date();
    if (days > 0) from.setDate(from.getDate() - days);
    setCustomFrom(toInputDate(from)); setCustomTo(toInputDate(to));
  };

  const activeLabel = isCustom
    ? (customFrom === customTo ? fmtDate(customFrom) : `${fmtDate(customFrom)} – ${fmtDate(customTo)}`)
    : [...RANGES, { label: 'All Time', value: 'all' }].find(r => r.value === range)?.label;

  // ── Export styled HTML report as printable page ──
  const exportReport = () => {
    const now = new Date().toLocaleString('en-IN');
    const userName = 'BP Report';
    const periodLabel = activeLabel || 'All Time';

    const catColor = (cat) => {
      switch (cat) {
        case 'Normal': return '#10b981';
        case 'Elevated': return '#f59e0b';
        case 'High BP Stage 1': return '#f97316';
        case 'High BP Stage 2': return '#ef4444';
        case 'Hypertensive Crisis': return '#dc2626';
        default: return '#64748b';
      }
    };

    const rows = readings.map(r => `
      <tr>
        <td>${r.recordedAt || '—'}</td>
        <td><strong style="color:#3b82f6">${r.systolic}</strong> <span class="unit">mmHg</span></td>
        <td><strong style="color:#06b6d4">${r.diastolic}</strong> <span class="unit">mmHg</span></td>
        <td>${r.pulse ? `<strong>${r.pulse}</strong> bpm` : '—'}</td>
        <td><span class="badge" style="background:${catColor(r.category)}22;color:${catColor(r.category)};border:1px solid ${catColor(r.category)}44">${r.category}</span></td>
        <td>${r.readingType || '—'}</td>
        <td>${r.notes || '—'}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>VitalsSaathi BP Report</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background:#f8fafc; color:#1e293b; }
    .page { max-width: 900px; margin: 0 auto; padding: 40px 32px; }

    /* Header */
    .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:36px; padding-bottom:20px; border-bottom:2px solid #e2e8f0; }
    .logo { display:flex; align-items:center; gap:14px; }
    .logo-icon { width:48px; height:48px; background:linear-gradient(145deg,#ff5f6d,#c0392b); border-radius:14px; display:flex; align-items:center; justify-content:center; }
    .logo-icon svg { width:26px; height:26px; }
    .logo-name { font-size:22px; font-weight:800; color:#1e293b; letter-spacing:-0.02em; }
    .logo-name span { color:#ff5f6d; }
    .logo-sub { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.12em; font-weight:600; margin-top:3px; }
    .header-right { text-align:right; }
    .report-title { font-size:13px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.08em; }
    .report-date { font-size:12px; color:#94a3b8; margin-top:4px; }

    /* Summary cards */
    .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:28px; }
    .card { background:#fff; border-radius:12px; padding:18px 16px; border:1px solid #e2e8f0; box-shadow:0 1px 4px rgba(0,0,0,0.05); }
    .card-label { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:8px; }
    .card-value { font-size:22px; font-weight:800; color:#1e293b; letter-spacing:-0.02em; }
    .card-unit { font-size:11px; color:#94a3b8; font-weight:400; margin-left:3px; }

    /* Period badge */
    .period-badge { display:inline-flex; align-items:center; gap:6px; background:#eff6ff; border:1px solid #bfdbfe; color:#3b82f6; padding:6px 14px; border-radius:99px; font-size:12px; font-weight:700; margin-bottom:20px; }

    /* Table */
    .table-wrap { background:#fff; border-radius:14px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05); }
    .table-header { padding:16px 20px; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; justify-content:space-between; }
    .table-title { font-size:14px; font-weight:800; color:#1e293b; }
    .table-count { font-size:12px; color:#94a3b8; font-weight:600; }
    table { width:100%; border-collapse:collapse; }
    thead tr { background:#f8fafc; }
    th { padding:12px 16px; text-align:left; font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.07em; white-space:nowrap; }
    tbody tr { border-top:1px solid #f1f5f9; }
    tbody tr:hover { background:#fafbff; }
    td { padding:13px 16px; font-size:13px; color:#374151; }
    .unit { font-size:10px; color:#94a3b8; }
    .badge { padding:3px 10px; border-radius:6px; font-size:11px; font-weight:700; }

    /* Footer */
    .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; }
    .footer-text { font-size:11px; color:#94a3b8; }
    .footer-brand { font-size:11px; font-weight:700; color:#ff5f6d; }

    @media print {
      body { background:#fff; }
      .page { padding:20px; }
    }
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z" fill="white"/>
          <path d="M6 11h2l1.5-3 2 6 1.5-4.5 1 1.5H18" stroke="rgba(255,100,100,0.9)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div>
        <div class="logo-name">VitalsSaathi<span>.AI</span></div>
        <div class="logo-sub">BP Monitor Report</div>
      </div>
    </div>
    <div class="header-right">
      <div class="report-title">Blood Pressure Report</div>
      <div class="report-date">Generated: ${now}</div>
    </div>
  </div>

  <!-- Period -->
  <div class="period-badge">📅 Period: ${periodLabel}</div>

  <!-- Summary -->
  ${summary && summary.totalReadings > 0 ? `
  <div class="summary">
    <div class="card">
      <div class="card-label">Avg BP</div>
      <div class="card-value">${summary.avgSystolic}/${summary.avgDiastolic}<span class="card-unit">mmHg</span></div>
    </div>
    <div class="card">
      <div class="card-label">Avg Pulse</div>
      <div class="card-value">${summary.avgPulse > 0 ? summary.avgPulse : '—'}<span class="card-unit">${summary.avgPulse > 0 ? 'bpm' : ''}</span></div>
    </div>
    <div class="card">
      <div class="card-label">Status</div>
      <div class="card-value" style="font-size:16px;color:${catColor(summary.category)}">${summary.category}</div>
    </div>
    <div class="card">
      <div class="card-label">Total Readings</div>
      <div class="card-value">${summary.totalReadings}</div>
    </div>
  </div>
  ` : ''}

  <!-- Table -->
  <div class="table-wrap">
    <div class="table-header">
      <div class="table-title">📋 Reading History</div>
      <div class="table-count">${readings.length} readings</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Date & Time</th>
          <th>Systolic</th>
          <th>Diastolic</th>
          <th>Pulse</th>
          <th>Category</th>
          <th>Type</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-text">This report is for personal health tracking purposes only.</div>
    <div class="footer-brand">VitalsSaathi.AI</div>
  </div>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const filterActive = {
    padding: '7px 16px', borderRadius: 99, cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
    border: 'none', background: 'var(--btn-primary-bg)',
    color: '#fff', boxShadow: 'var(--btn-primary-shadow)', transition: 'all 0.2s',
  };
  const filterInactive = {
    padding: '7px 16px', borderRadius: 99, cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
    border: '1px solid var(--border)', background: 'var(--card)',
    color: 'var(--text2)', transition: 'all 0.2s',
  };

  return (
    <div className="fade-in">
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Reading History</h1>
          <p style={{ color: 'var(--text3)', marginTop: 4, fontSize: 14 }}>
            {readings.length} reading{readings.length !== 1 ? 's' : ''} total
            {activeLabel && <span style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 600 }}>· {activeLabel}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportReport} style={{
            padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
            border: '1px solid var(--border)', background: 'var(--card)',
            color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.2s',
          }}>
            📄 Export Report
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/log')} style={{ fontSize: 13 }}>+ Log Reading</button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {[{ label: 'All Time', value: 'all' }, ...RANGES.slice(0, 5)].map(r => (
          <button key={r.value} onClick={() => clickRange(r.value)}
            style={!isCustom && range === r.value ? filterActive : filterInactive}>
            {r.label}
          </button>
        ))}

        {/* Custom Date Range Picker */}
        <div ref={pickerRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowPicker(v => !v)} style={{
            ...(isCustom ? filterActive : filterInactive),
            display: 'flex', alignItems: 'center', gap: 6, position: 'relative', paddingRight: isCustom ? 28 : 16,
          }}>
            📅 {isCustom ? activeLabel : 'Custom Range'}
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
                    {[{ l: 'Today', d: 0 }, { l: '3 Days', d: 3 }, { l: '7 Days', d: 7 },
                      { l: '14 Days', d: 14 }, { l: '30 Days', d: 30 }, { l: '3 Months', d: 90 }].map(({ l, d }) => (
                      <button key={l} onClick={() => quickSelect(d)} style={{
                        padding: '5px 11px', borderRadius: 99, border: '1px solid var(--border)',
                        background: 'var(--bg3)', color: 'var(--text2)',
                        fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer',
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

      {/* ── Summary Strip ── */}
      {summary && summary.totalReadings > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Avg BP', value: `${summary.avgSystolic}/${summary.avgDiastolic}`, unit: 'mmHg' },
            { label: 'Avg Pulse', value: summary.avgPulse > 0 ? summary.avgPulse : '—', unit: 'bpm' },
            { label: 'Status', value: summary.category },
            { label: 'Trend', value: summary.trend },
          ].map(s => (
            <div key={s.label} className="card" style={{ flex: 1, minWidth: 120, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
                {s.value} <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>{s.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner" /></div>
      ) : readings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No readings found</div>
          <div style={{ color: 'var(--text3)', marginBottom: 20 }}>Try a different time range or log a new reading</div>
          <button className="btn btn-primary" onClick={() => navigate('/log')}>+ Log First Reading</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                  {['Date & Time', 'Systolic', 'Diastolic', 'Pulse', 'Category', 'Type', 'Notes', ''].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {readings.map((r, i) => {
                  const cs = getCategoryStyle(r.category);
                  return (
                    <tr key={r.id} style={{ borderBottom: i < readings.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,58,95,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 16px', color: 'var(--text2)', fontSize: 13, whiteSpace: 'nowrap' }}>{r.recordedAt}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>{r.systolic}</span>
                        <span style={{ color: 'var(--text3)', fontSize: 11, marginLeft: 2 }}>mmHg</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--accent2)' }}>{r.diastolic}</span>
                        <span style={{ color: 'var(--text3)', fontSize: 11, marginLeft: 2 }}>mmHg</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text2)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                        {r.pulse ? `${r.pulse} bpm` : <span style={{ color: 'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 6, background: cs.bg, border: `1px solid ${cs.border}`, color: cs.color, fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {r.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', padding: '3px 8px', borderRadius: 4 }}>
                          {r.readingType === 'VOICE' ? '🎙️' : r.readingType === 'TEXT' ? '💬' : '✍️'} {r.readingType}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text3)', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.notes || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button className="btn btn-danger" onClick={() => handleDelete(r.id)}
                          disabled={deleting === r.id} style={{ fontSize: 12, padding: '6px 12px' }}>
                          {deleting === r.id ? '...' : '🗑️'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}