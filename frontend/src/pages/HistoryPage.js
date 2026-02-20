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

const ITEMS_PER_PAGE = 10;

// ── Mobile Reading Card ──
function MobileCard({ r, idx, onDelete, deleting }) {
  const cs = getCategoryStyle(r.category);
  return (
    <div style={{
      background: 'var(--card)', borderRadius: 16, padding: '14px 16px',
      marginBottom: 10, border: '1px solid var(--border)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
    }}>
      {/* Row 1: number + datetime + delete */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text3)', flexShrink: 0 }}>{idx}</div>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{r.recordedAt}</span>
        </div>
        <button onClick={() => onDelete(r.id)} disabled={deleting === r.id}
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 14, color: '#ef4444', lineHeight: 1 }}>
          {deleting === r.id ? '…' : '🗑️'}
        </button>
      </div>

      {/* Row 2: Big BP values */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, marginBottom: 12 }}>
        {/* Systolic */}
        <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Systolic</div>
          <div style={{ fontSize: 36, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{r.systolic}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>mmHg</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text3)', fontSize: 22, fontWeight: 300 }}>/</div>

        {/* Diastolic */}
        <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Diastolic</div>
          <div style={{ fontSize: 36, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent2)', lineHeight: 1 }}>{r.diastolic}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>mmHg</div>
        </div>

        {/* Pulse */}
        {r.pulse && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text3)', fontSize: 22, fontWeight: 300 }}>·</div>
            <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Pulse</div>
              <div style={{ fontSize: 36, fontFamily: 'var(--font-display)', fontWeight: 800, color: '#a855f7', lineHeight: 1 }}>{r.pulse}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>bpm</div>
            </div>
          </>
        )}
      </div>

      {/* Row 3: Category + Type */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ padding: '5px 12px', borderRadius: 8, background: cs.bg, border: `1px solid ${cs.border}`, color: cs.color, fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          {r.category}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', padding: '4px 10px', borderRadius: 6 }}>
          {r.readingType === 'VOICE' ? '🎙️' : r.readingType === 'TEXT' ? '💬' : '✍️'} {r.readingType}
        </span>
      </div>

      {/* Notes */}
      {r.notes && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          📝 {r.notes}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const todayStr = toInputDate(new Date());
  const pickerRef = useRef(null);
  const dropdownRef = useRef(null);

  const [readings,   setReadings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [range,      setRange]      = useState('today');
  const [deleting,   setDeleting]   = useState(null);
  const [summary,    setSummary]    = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [customFrom, setCustomFrom] = useState(todayStr);
  const [customTo,   setCustomTo]   = useState(todayStr);
  const [isCustom,   setIsCustom]   = useState(false);
  const [page,       setPage]       = useState(1);
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target) &&
          dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const fetchData = async () => {
    setLoading(true); setPage(1);
    try {
      let readRes, sumRes;
      if (isCustom) {
        [readRes, sumRes] = await Promise.all([
          readingsAPI.getByCustomRange(customFrom, customTo),
          readingsAPI.getSummaryCustom(customFrom, customTo),
        ]);
      } else if (range === 'all') {
        [readRes, sumRes] = await Promise.all([readingsAPI.getAll(), readingsAPI.getSummary('all')]);
      } else {
        [readRes, sumRes] = await Promise.all([readingsAPI.getByRange(range), readingsAPI.getSummary(range)]);
      }
      let data = readRes.data || [];
      if (range === 'today' && !isCustom) {
        data = data.filter(r => (r.recordedAt || '').slice(0, 10) === todayStr);
      }
      setReadings(data);
      setSummary(sumRes.data);
    } catch (e) { console.error(e); setReadings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [range, isCustom, customFrom, customTo]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reading?')) return;
    setDeleting(id);
    try { await readingsAPI.delete(id); setReadings(r => r.filter(x => x.id !== id)); }
    catch (e) { alert('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const applyCustom = () => { if (customFrom && customTo) { setIsCustom(true); setShowPicker(false); } };
  const clearCustom = (e) => { e.stopPropagation(); setIsCustom(false); setRange('today'); setCustomFrom(todayStr); setCustomTo(todayStr); };
  const clickRange  = (v) => { setRange(v); setIsCustom(false); setShowPicker(false); };
  const quickSelect = (days) => {
    const to = new Date(), from = new Date();
    if (days > 0) from.setDate(from.getDate() - days);
    setCustomFrom(toInputDate(from)); setCustomTo(toInputDate(to));
  };

  const activeLabel = isCustom
    ? (customFrom === customTo ? fmtDate(customFrom) : `${fmtDate(customFrom)} – ${fmtDate(customTo)}`)
    : (range === 'all' ? 'All Time' : RANGES.find(r => r.value === range)?.label);

  const totalPages = Math.ceil(readings.length / ITEMS_PER_PAGE);
  const paginated  = readings.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Export Report
  const exportReport = () => {
    const now = new Date().toLocaleString('en-IN');
    const catColor = (cat) => ({ Normal:'#10b981', Elevated:'#f59e0b', 'High BP Stage 1':'#f97316', 'High BP Stage 2':'#ef4444', 'Hypertensive Crisis':'#dc2626' }[cat] || '#64748b');
    const rows = readings.map((r, i) => `<tr class="${i%2===0?'even':'odd'}"><td class="center num">${i+1}</td><td>${r.recordedAt||'—'}</td><td class="center"><strong style="color:#3b82f6">${r.systolic}</strong> <span class="unit">mmHg</span></td><td class="center"><strong style="color:#06b6d4">${r.diastolic}</strong> <span class="unit">mmHg</span></td><td class="center">${r.pulse?`<strong style="color:#a855f7">${r.pulse}</strong> <span class="unit">bpm</span>`:'—'}</td><td class="center"><span class="badge" style="background:${catColor(r.category)}18;color:${catColor(r.category)};border:1.5px solid ${catColor(r.category)}55">${r.category}</span></td><td>${r.notes||'—'}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>VitalsSaathi — ${activeLabel}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Inter',sans-serif;background:#f1f5f9;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.page{max-width:960px;margin:0 auto;padding:32px 24px;}.header{background:linear-gradient(135deg,#0f172a,#1e3a5f,#1d4ed8);border-radius:18px;padding:28px 32px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 8px 30px rgba(29,78,216,.35);}.logo{display:flex;align-items:center;gap:14px;}.logo-icon{width:48px;height:48px;background:linear-gradient(145deg,#ff5f6d,#c0392b);border-radius:14px;display:flex;align-items:center;justify-content:center;}.logo-name{font-size:21px;font-weight:800;color:#fff;letter-spacing:-.02em;}.logo-name span{color:#ff6b6b;}.logo-sub{font-size:9px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.15em;font-weight:700;margin-top:4px;}.hright{text-align:right;}.rbadge{display:inline-block;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:99px;padding:5px 14px;font-size:11px;font-weight:700;margin-bottom:6px;}.rperiod{font-size:19px;font-weight:800;color:#fff;}.rmeta{font-size:11px;color:rgba(255,255,255,.4);margin-top:4px;}.sum-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;}.sum-card{background:#fff;border-radius:12px;padding:16px;border:1px solid #e2e8f0;}.sum-lbl{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px;}.sum-val{font-size:22px;font-weight:800;color:#1e293b;letter-spacing:-.02em;}.sum-unit{font-size:10px;color:#94a3b8;margin-left:2px;}.sum-sub{font-size:11px;color:#94a3b8;margin-top:4px;}.tcard{background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;}.thead-bar{padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#f8faff,#eef2ff);}.thead-title{font-size:14px;font-weight:800;color:#1e293b;}.thead-count{background:#eff6ff;color:#3b82f6;border:1px solid #bfdbfe;border-radius:99px;padding:4px 12px;font-size:11px;font-weight:700;}table{width:100%;border-collapse:collapse;}thead tr{background:#f8fafc;}th{padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap;}.center{text-align:center;}td{padding:10px 12px;font-size:13px;color:#374151;}.num{color:#94a3b8;font-size:11px;}.even{background:#fff;}.odd{background:#f9fafb;}tr:not(:last-child) td{border-bottom:1px solid #f1f5f9;}.unit{font-size:10px;color:#94a3b8;}.badge{padding:3px 9px;border-radius:6px;font-size:11px;font-weight:700;}.footer{margin-top:16px;padding:12px 18px;background:#fff;border-radius:10px;border:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;}.footer-txt{font-size:11px;color:#94a3b8;}.footer-brand{font-size:12px;font-weight:800;color:#1e293b;}.footer-brand span{color:#ff5f6d;}@media print{body{background:#fff;}.page{padding:12px;}}</style>
</head><body><div class="page">
<div class="header"><div class="logo"><div class="logo-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z" fill="white"/><path d="M6 11h2l1.5-3 2 6 1.5-4.5 1 1.5H18" stroke="rgba(255,100,100,0.9)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div><div class="logo-name">VitalsSaathi<span>.AI</span></div><div class="logo-sub">Blood Pressure Monitor</div></div></div><div class="hright"><div class="rbadge">📋 Health Report</div><div class="rperiod">${activeLabel}</div><div class="rmeta">Generated: ${now}</div></div></div>
${summary&&summary.totalReadings>0?`<div class="sum-grid"><div class="sum-card"><div class="sum-lbl">Avg Systolic</div><div class="sum-val">${summary.avgSystolic}<span class="sum-unit">mmHg</span></div><div class="sum-sub">Range: ${summary.minSystolic}–${summary.maxSystolic}</div></div><div class="sum-card"><div class="sum-lbl">Avg Diastolic</div><div class="sum-val">${summary.avgDiastolic}<span class="sum-unit">mmHg</span></div><div class="sum-sub">Range: ${summary.minDiastolic}–${summary.maxDiastolic}</div></div><div class="sum-card"><div class="sum-lbl">Avg Pulse</div><div class="sum-val">${summary.avgPulse>0?summary.avgPulse:'—'}<span class="sum-unit">${summary.avgPulse>0?'bpm':''}</span></div><div class="sum-sub">${summary.maxPulse>0?`Range: ${summary.minPulse}–${summary.maxPulse}`:'—'}</div></div><div class="sum-card"><div class="sum-lbl">Status</div><div class="sum-val" style="font-size:16px;color:${catColor(summary.category)}">${summary.category}</div><div class="sum-sub">${readings.length} total readings</div></div></div>`:''}
<div class="tcard"><div class="thead-bar"><div class="thead-title">📊 Reading Details</div><div class="thead-count">${readings.length} readings</div></div>
<table><thead><tr><th class="center">#</th><th>Date &amp; Time</th><th class="center">Systolic</th><th class="center">Diastolic</th><th class="center">Pulse</th><th class="center">Category</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table></div>
<div class="footer"><div class="footer-txt">⚕️ For personal tracking only. Consult a doctor for medical advice.</div><div class="footer-brand">Vitals<span>Saathi</span>.AI</div></div>
</div><script>window.onload=()=>window.print();</script></body></html>`;
    window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank');
  };

  const fA = { padding: '7px 14px', borderRadius: 99, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, border: 'none', background: 'var(--btn-primary-bg)', color: '#fff', boxShadow: 'var(--btn-primary-shadow)', whiteSpace: 'nowrap', flexShrink: 0 };
  const fI = { padding: '7px 14px', borderRadius: 99, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text2)', whiteSpace: 'nowrap', flexShrink: 0 };

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Reading History</h1>
          <p style={{ color: 'var(--text3)', marginTop: 3, fontSize: 13 }}>
            {readings.length} reading{readings.length !== 1 ? 's' : ''}
            {activeLabel && <span style={{ marginLeft: 6, color: 'var(--accent)', fontWeight: 600 }}>· {activeLabel}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={exportReport} style={{ padding: '9px 13px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 5 }}>
            📄 {isMobile ? '' : 'Export Report'}
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/log')} style={{ fontSize: 12, padding: '9px 13px' }}>+ Log</button>
        </div>
      </div>

      {/* Filters — scrollable on mobile, with picker outside scroll container */}
      <div style={{ marginBottom: 14, position: 'relative' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <button onClick={() => clickRange('all')}   style={!isCustom && range==='all'   ? fA : fI}>All Time</button>
        <button onClick={() => clickRange('today')} style={!isCustom && range==='today' ? fA : fI}>Today</button>
        {RANGES.slice(1, 5).map(r => (
          <button key={r.value} onClick={() => clickRange(r.value)} style={!isCustom && range===r.value ? fA : fI}>{r.label}</button>
        ))}

        {/* Custom picker button (inside scroll row) */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button ref={pickerRef} onClick={() => setShowPicker(v => !v)} style={{ ...(isCustom ? fA : fI), display: 'flex', alignItems: 'center', gap: 5, paddingRight: isCustom ? 26 : 14 }}>
            📅 {isCustom ? activeLabel : 'Custom'}
          </button>
          {isCustom && (
            <button onClick={clearCustom} style={{ position: 'absolute', top: -5, right: -5, width: 17, height: 17, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: 9, cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>✕</button>
          )}
        </div>
      </div>

      {/* Custom date picker dropdown — OUTSIDE the overflow row so it doesn't get clipped */}
      {showPicker && (
        <div ref={dropdownRef} style={{ zIndex: 300, marginBottom: 10 }}>
          <div className="date-picker-popover" style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: 18, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', maxWidth: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>📅 Select Date Range</div>
              <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>From</label>
                <input type="date" className="input" value={customFrom} max={customTo} onChange={e => setCustomFrom(e.target.value)} style={{ fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>To</label>
                <input type="date" className="input" value={customTo} min={customFrom} max={todayStr} onChange={e => setCustomTo(e.target.value)} style={{ fontSize: 13 }} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Quick Select</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {[{l:'Today',d:0},{l:'7 Days',d:7},{l:'14 Days',d:14},{l:'30 Days',d:30},{l:'3 Months',d:90}].map(({l,d}) => (
                    <button key={l} onClick={() => quickSelect(d)} style={{ padding: '5px 10px', borderRadius: 99, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer' }}>{l}</button>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" onClick={applyCustom} disabled={!customFrom||!customTo} style={{ width: '100%', padding: '10px', fontSize: 13, opacity: (!customFrom||!customTo)?0.4:1 }}>Apply Range</button>
            </div>
          </div>
        </div>
      )}

      {/* Summary — 2 cols on mobile, 4 on desktop */}
      {summary && summary.totalReadings > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Avg BP',    value: `${summary.avgSystolic}/${summary.avgDiastolic}`, unit: 'mmHg' },
            { label: 'Avg Pulse', value: summary.avgPulse > 0 ? summary.avgPulse : '—', unit: summary.avgPulse > 0 ? 'bpm' : '' },
            { label: 'Status',    value: summary.category },
            { label: 'Trend',     value: summary.trend },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                {s.value} <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>{s.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner" /></div>
      ) : readings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No readings found</div>
          <div style={{ color: 'var(--text3)', marginBottom: 20 }}>Try a different time range</div>
          <button className="btn btn-primary" onClick={() => navigate('/log')}>+ Log First Reading</button>
        </div>
      ) : (
        <>
          {/* MOBILE: Card layout */}
          {isMobile ? (
            <div>
              {paginated.map((r, i) => (
                <MobileCard key={r.id} r={r} idx={(page-1)*ITEMS_PER_PAGE+i+1} onDelete={handleDelete} deleting={deleting} />
              ))}
            </div>
          ) : (
            /* DESKTOP: Table layout */
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                      {['#','Date & Time','Systolic','Diastolic','Pulse','Category','Type','Notes',''].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: ['#','Systolic','Diastolic','Pulse','Category','Type'].includes(h)?'center':'left', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((r, i) => {
                      const cs = getCategoryStyle(r.category);
                      const idx = (page-1)*ITEMS_PER_PAGE+i+1;
                      return (
                        <tr key={r.id} style={{ borderBottom: i<paginated.length-1?'1px solid var(--border)':'none', transition: 'background 0.15s' }}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(30,58,95,0.15)'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'14px 16px', textAlign:'center', color:'var(--text3)', fontSize:12, fontWeight:600 }}>{idx}</td>
                          <td style={{ padding:'14px 16px', color:'var(--text2)', fontSize:13, whiteSpace:'nowrap' }}>{r.recordedAt}</td>
                          <td style={{ padding:'14px 16px', textAlign:'center' }}><span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, color:'var(--accent)' }}>{r.systolic}</span><span style={{ color:'var(--text3)', fontSize:11, marginLeft:2 }}>mmHg</span></td>
                          <td style={{ padding:'14px 16px', textAlign:'center' }}><span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, color:'var(--accent2)' }}>{r.diastolic}</span><span style={{ color:'var(--text3)', fontSize:11, marginLeft:2 }}>mmHg</span></td>
                          <td style={{ padding:'14px 16px', textAlign:'center', color:'var(--text2)', fontFamily:'var(--font-display)', fontWeight:600 }}>{r.pulse?`${r.pulse} bpm`:<span style={{color:'var(--text3)'}}>—</span>}</td>
                          <td style={{ padding:'14px 16px', textAlign:'center' }}><span style={{ padding:'4px 10px', borderRadius:6, background:cs.bg, border:`1px solid ${cs.border}`, color:cs.color, fontSize:12, fontFamily:'var(--font-display)', fontWeight:600 }}>{r.category}</span></td>
                          <td style={{ padding:'14px 16px', textAlign:'center' }}><span style={{ fontSize:11, color:'var(--text3)', background:'var(--bg3)', padding:'3px 8px', borderRadius:4 }}>{r.readingType==='VOICE'?'🎙️':r.readingType==='TEXT'?'💬':'✍️'} {r.readingType}</span></td>
                          <td style={{ padding:'14px 16px', color:'var(--text3)', fontSize:13, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.notes||'—'}</td>
                          <td style={{ padding:'14px 16px' }}><button className="btn btn-danger" onClick={()=>handleDelete(r.id)} disabled={deleting===r.id} style={{ fontSize:12, padding:'6px 12px' }}>{deleting===r.id?'...':'🗑️'}</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, flexWrap:'wrap', gap:8 }}>
              <div style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--font-display)' }}>
                {(page-1)*ITEMS_PER_PAGE+1}–{Math.min(page*ITEMS_PER_PAGE,readings.length)} of {readings.length}
              </div>
              <div style={{ display:'flex', gap:5 }}>
                <button onClick={()=>setPage(1)} disabled={page===1} style={{ padding:'7px 11px', borderRadius:8, border:'1px solid var(--border)', background:page===1?'var(--bg3)':'var(--card)', color:page===1?'var(--text3)':'var(--text)', cursor:page===1?'not-allowed':'pointer', fontSize:13 }}>«</button>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding:'7px 11px', borderRadius:8, border:'1px solid var(--border)', background:page===1?'var(--bg3)':'var(--card)', color:page===1?'var(--text3)':'var(--text)', cursor:page===1?'not-allowed':'pointer', fontSize:13 }}>‹</button>
                {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1).reduce((acc,p,idx,arr)=>{if(idx>0&&p-arr[idx-1]>1)acc.push('...');acc.push(p);return acc;},[]).map((p,idx)=>
                  p==='...'
                    ? <span key={`e${idx}`} style={{ color:'var(--text3)', padding:'0 2px', lineHeight:'32px' }}>…</span>
                    : <button key={p} onClick={()=>setPage(p)} style={{ padding:'7px 11px', borderRadius:8, border:p===page?'none':'1px solid var(--border)', background:p===page?'var(--btn-primary-bg)':'var(--card)', color:p===page?'#fff':'var(--text)', cursor:'pointer', fontSize:13, fontWeight:700 }}>{p}</button>
                )}
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ padding:'7px 11px', borderRadius:8, border:'1px solid var(--border)', background:page===totalPages?'var(--bg3)':'var(--card)', color:page===totalPages?'var(--text3)':'var(--text)', cursor:page===totalPages?'not-allowed':'pointer', fontSize:13 }}>›</button>
                <button onClick={()=>setPage(totalPages)} disabled={page===totalPages} style={{ padding:'7px 11px', borderRadius:8, border:'1px solid var(--border)', background:page===totalPages?'var(--bg3)':'var(--card)', color:page===totalPages?'var(--text3)':'var(--text)', cursor:page===totalPages?'not-allowed':'pointer', fontSize:13 }}>»</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}