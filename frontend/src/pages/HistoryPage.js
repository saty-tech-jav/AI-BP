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

/* ── Mobile Reading Card — compact single-row layout ── */
function MobileCard({ r, idx, onDelete, deleting }) {
  const cs = getCategoryStyle(r.category);
  return (
    <div style={{
      background: 'var(--card)', borderRadius: 14, padding: '12px 14px',
      marginBottom: 8, border: '1px solid var(--border)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {/* Top row: index + time + delete */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--text3)', flexShrink: 0 }}>{idx}</div>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{r.recordedAt}</span>
        </div>
        <button onClick={() => onDelete(r.id)} disabled={deleting === r.id}
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', fontSize: 13, color: '#ef4444', lineHeight: 1, flexShrink: 0 }}>
          {deleting === r.id ? '…' : '🗑️'}
        </button>
      </div>

      {/* BP values row — compact horizontal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 10, background: 'var(--bg3)', borderRadius: 10, padding: '10px 12px' }}>
        {/* Systolic */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>SYS</div>
          <div style={{ fontSize: 34, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{r.systolic}</div>
          <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1 }}>mmHg</div>
        </div>
        <div style={{ color: 'var(--text3)', fontSize: 20, fontWeight: 200, padding: '0 4px' }}>/</div>
        {/* Diastolic */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>DIA</div>
          <div style={{ fontSize: 34, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent2)', lineHeight: 1 }}>{r.diastolic}</div>
          <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1 }}>mmHg</div>
        </div>
        {r.pulse && (
          <>
            <div style={{ width: 1, height: 44, background: 'var(--border)', margin: '0 8px' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>PULSE</div>
              <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800, color: '#a855f7', lineHeight: 1 }}>{r.pulse}</div>
              <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1 }}>bpm</div>
            </div>
          </>
        )}
      </div>

      {/* Bottom row: category badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ padding: '4px 10px', borderRadius: 7, background: cs.bg, border: `1px solid ${cs.border}`, color: cs.color, fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          {r.category}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', padding: '3px 8px', borderRadius: 5 }}>
          {r.readingType === 'VOICE' ? '🎙️' : r.readingType === 'TEXT' ? '💬' : '✍️'} {r.readingType || 'MANUAL'}
        </span>
      </div>
      {r.notes && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          📝 {r.notes}
        </div>
      )}
    </div>
  );
}

/* ── Mobile Date Picker Bottom Sheet ── */
function MobileDateModal({ show, onClose, customFrom, customTo, setCustomFrom, setCustomTo, todayStr, onApply, quickSelect }) {
  if (!show) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001, background: 'var(--bg3)', borderRadius: '20px 20px 0 0', padding: '8px 16px 48px', boxShadow: '0 -8px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 20px' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--text)', marginBottom: 20 }}>📅 Select Date Range</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>From</label>
            <input type="date" className="input" value={customFrom} max={customTo} onChange={e => setCustomFrom(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>To</label>
            <input type="date" className="input" value={customTo} min={customFrom} max={todayStr} onChange={e => setCustomTo(e.target.value)} />
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Quick Select</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {[{l:'Today',d:0},{l:'7 Days',d:7},{l:'14 Days',d:14},{l:'30 Days',d:30},{l:'3 Months',d:90}].map(({l,d}) => (
            <button key={l} onClick={() => quickSelect(d)} style={{ padding: '9px 16px', borderRadius: 99, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text2)', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer' }}>{l}</button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={onApply} disabled={!customFrom || !customTo} style={{ width: '100%', padding: '15px', fontSize: 15, opacity: (!customFrom || !customTo) ? 0.4 : 1 }}>
          Apply Range
        </button>
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    const fn = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [isMobile]);

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
  const clickRange = (v) => { setRange(v); setIsCustom(false); setShowPicker(false); };
  const quickSelect = (days) => {
    const to = new Date(), from = new Date();
    if (days > 0) from.setDate(from.getDate() - days);
    setCustomFrom(toInputDate(from)); setCustomTo(toInputDate(to));
  };

  const activeLabel = isCustom
    ? (customFrom === customTo ? fmtDate(customFrom) : `${fmtDate(customFrom)} – ${fmtDate(customTo)}`)
    : (range === 'all' ? 'All Time' : RANGES.find(r => r.value === range)?.label);

  const totalPages = Math.ceil(readings.length / ITEMS_PER_PAGE);
  const paginated = readings.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const exportReport = () => {
    const now = new Date().toLocaleString('en-IN');
    const catColor = (cat) => ({ Normal:'#10b981', Elevated:'#f59e0b', 'High BP Stage 1':'#f97316', 'High BP Stage 2':'#ef4444', 'Hypertensive Crisis':'#dc2626' }[cat] || '#64748b');
    const rows = readings.map((r, i) => `<tr class="${i%2===0?'even':'odd'}"><td class="center num">${i+1}</td><td>${r.recordedAt||'—'}</td><td class="center"><strong style="color:#3b82f6">${r.systolic}</strong> <span class="unit">mmHg</span></td><td class="center"><strong style="color:#06b6d4">${r.diastolic}</strong> <span class="unit">mmHg</span></td><td class="center">${r.pulse?`<strong style="color:#a855f7">${r.pulse}</strong> <span class="unit">bpm</span>`:'—'}</td><td class="center"><span class="badge" style="background:${catColor(r.category)}18;color:${catColor(r.category)};border:1.5px solid ${catColor(r.category)}55">${r.category}</span></td><td>${r.notes||'—'}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>VitalsSaathi — ${activeLabel}</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:sans-serif;background:#f1f5f9;}.page{max-width:960px;margin:0 auto;padding:32px 24px;}.header{background:linear-gradient(135deg,#0f172a,#1d4ed8);border-radius:18px;padding:28px 32px;margin-bottom:18px;color:#fff;display:flex;justify-content:space-between;align-items:center;}.logo-name{font-size:21px;font-weight:800;}.logo-name span{color:#ff6b6b;}.rperiod{font-size:19px;font-weight:800;}.rmeta{font-size:11px;opacity:.5;margin-top:4px;}table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;}th{padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;background:#f8fafc;}td{padding:10px 12px;font-size:13px;color:#374151;}.center{text-align:center;}.even{background:#fff;}.odd{background:#f9fafb;}tr:not(:last-child) td{border-bottom:1px solid #f1f5f9;}.unit{font-size:10px;color:#94a3b8;}.badge{padding:3px 9px;border-radius:6px;font-size:11px;font-weight:700;}.num{color:#94a3b8;font-size:11px;}.footer{margin-top:16px;text-align:right;font-size:11px;color:#94a3b8;}</style></head><body><div class="page"><div class="header"><div><div class="logo-name">VitalsSaathi<span>.AI</span></div><div style="font-size:9px;opacity:.4;text-transform:uppercase;letter-spacing:.15em;margin-top:4px">Blood Pressure Monitor</div></div><div style="text-align:right"><div class="rperiod">${activeLabel}</div><div class="rmeta">Generated: ${now}</div></div></div><table><thead><tr><th class="center">#</th><th>Date &amp; Time</th><th class="center">Systolic</th><th class="center">Diastolic</th><th class="center">Pulse</th><th class="center">Category</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table><div class="footer">⚕️ For personal tracking only. Consult a doctor for medical advice.</div></div><script>window.onload=()=>window.print();</script></body></html>`;
    window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank');
  };

  const fA = { padding: '8px 15px', borderRadius: 99, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, border: 'none', background: 'var(--btn-primary-bg)', color: '#fff', boxShadow: 'var(--btn-primary-shadow)', whiteSpace: 'nowrap', flexShrink: 0 };
  const fI = { padding: '8px 15px', borderRadius: 99, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text2)', whiteSpace: 'nowrap', flexShrink: 0 };

  return (
    <div className="fade-in">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Reading History</h1>
          <p style={{ color: 'var(--text3)', marginTop: 3, fontSize: 13 }}>
            {readings.length} reading{readings.length !== 1 ? 's' : ''}
            {activeLabel && <span style={{ marginLeft: 6, color: 'var(--accent)', fontWeight: 600 }}>· {activeLabel}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={exportReport} style={{ padding: '9px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 5 }}>
            📄{!isMobile && ' Export'}
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/log')} style={{ fontSize: 12, padding: '9px 13px' }}>+ Log</button>
        </div>
      </div>

      {/* Filter bar — fully scrollable, Custom picker inside */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 6, WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
        <button onClick={() => clickRange('all')} style={!isCustom && range === 'all' ? fA : fI}>All Time</button>
        <button onClick={() => clickRange('today')} style={!isCustom && range === 'today' ? fA : fI}>Today</button>
        {RANGES.slice(1, 5).map(r => (
          <button key={r.value} onClick={() => clickRange(r.value)} style={!isCustom && range === r.value ? fA : fI}>{r.label}</button>
        ))}
        {/* Custom picker button */}
        <div ref={pickerRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowPicker(v => !v)} style={{ ...(isCustom ? fA : fI), display: 'flex', alignItems: 'center', gap: 5 }}>
            📅 {isCustom ? activeLabel : 'Custom'}
          </button>
          {isCustom && (
            <button onClick={clearCustom} style={{ position: 'absolute', top: -5, right: -5, width: 17, height: 17, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: 9, cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>✕</button>
          )}
          {/* Desktop dropdown only */}
          {!isMobile && showPicker && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 300, background: 'var(--card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)', padding: 18, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', width: 290 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>📅 Select Date Range</div>
                <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>From</label>
                  <input type="date" className="input" value={customFrom} max={customTo} onChange={e => setCustomFrom(e.target.value)} style={{ fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>To</label>
                  <input type="date" className="input" value={customTo} min={customFrom} max={todayStr} onChange={e => setCustomTo(e.target.value)} style={{ fontSize: 13 }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {[{l:'Today',d:0},{l:'7 Days',d:7},{l:'14 Days',d:14},{l:'30 Days',d:30},{l:'3 Months',d:90}].map(({l,d}) => (
                    <button key={l} onClick={() => quickSelect(d)} style={{ padding: '5px 10px', borderRadius: 99, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer' }}>{l}</button>
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
          quickSelect={quickSelect}
        />
      )}

      {/* Summary strip — horizontal compact on mobile */}
      {summary && summary.totalReadings > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
          {[
            { label: 'Avg BP', value: `${summary.avgSystolic}/${summary.avgDiastolic}`, unit: 'mmHg' },
            { label: 'Avg Pulse', value: summary.avgPulse > 0 ? summary.avgPulse : '—', unit: summary.avgPulse > 0 ? 'bpm' : '' },
            { label: 'Status', value: summary.category },
            { label: 'Trend', value: summary.trend },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '10px 14px', flexShrink: 0, minWidth: isMobile ? 120 : 'auto', flex: isMobile ? '0 0 auto' : 1 }}>
              <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                {s.value} <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>{s.unit}</span>
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
          {isMobile ? (
            <div>
              {paginated.map((r, i) => (
                <MobileCard key={r.id} r={r} idx={(page-1)*ITEMS_PER_PAGE+i+1} onDelete={handleDelete} deleting={deleting} />
              ))}
            </div>
          ) : (
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

          {totalPages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, flexWrap:'wrap', gap:8 }}>
              <div style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--font-display)' }}>
                {(page-1)*ITEMS_PER_PAGE+1}–{Math.min(page*ITEMS_PER_PAGE,readings.length)} of {readings.length}
              </div>
              <div style={{ display:'flex', gap:5 }}>
                <button onClick={()=>setPage(1)} disabled={page===1} style={{ padding:'7px 11px', borderRadius:8, border:'1px solid var(--border)', background:page===1?'var(--bg3)':'var(--card)', color:page===1?'var(--text3)':'var(--text)', cursor:page===1?'not-allowed':'pointer', fontSize:13 }}>«</button>
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding:'7px 11px', borderRadius:8, border:'1px solid var(--border)', background:page===1?'var(--bg3)':'var(--card)', color:page===1?'var(--text3)':'var(--text)', cursor:page===1?'not-allowed':'pointer', fontSize:13 }}>‹</button>
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