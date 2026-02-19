import React, { useState, useEffect } from 'react';
import { readingsAPI } from '../services/api';
import { getCategoryStyle, RANGES } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [summary, setSummary] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [readRes, sumRes] = await Promise.all([
        range === 'all' ? readingsAPI.getAll() : readingsAPI.getByRange(range),
        readingsAPI.getSummary(range === 'all' ? 'all' : range),
      ]);
      setReadings(readRes.data);
      setSummary(sumRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [range]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reading?')) return;
    setDeleting(id);
    try {
      await readingsAPI.delete(id);
      setReadings(r => r.filter(x => x.id !== id));
    } catch (e) { alert('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const exportCSV = () => {
    const rows = [['Date', 'Time', 'Systolic', 'Diastolic', 'Pulse', 'Category', 'Notes', 'Type']];
    readings.forEach(r => {
      const [date, time] = (r.recordedAt || '').split(' ');
      rows.push([date, time, r.systolic, r.diastolic, r.pulse || '', r.category, r.notes || '', r.readingType]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `bp-readings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const catStyle = (cat) => getCategoryStyle(cat);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Reading History</h1>
          <p style={{ color: 'var(--text3)', marginTop: 4, fontSize: 14 }}>
            {readings.length} reading{readings.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={exportCSV} style={{ fontSize: 13 }}>⬇️ Export CSV</button>
          <button className="btn btn-primary" onClick={() => navigate('/log')} style={{ fontSize: 13 }}>+ Log Reading</button>
        </div>
      </div>

      {/* Range filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[{ label: 'All Time', value: 'all' }, ...RANGES.slice(0, 5)].map(r => (
          <button key={r.value} onClick={() => setRange(r.value)}
            style={{
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12,
              background: range === r.value ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'var(--bg3)',
              color: range === r.value ? 'white' : 'var(--text2)', transition: 'all 0.2s',
            }}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Summary strip */}
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
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{s.value} <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>{s.unit}</span></div>
            </div>
          ))}
        </div>
      )}

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
          {/* Desktop table */}
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
                  const cs = catStyle(r.category);
                  return (
                    <tr key={r.id} style={{
                      borderBottom: i < readings.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.15s',
                    }}
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
                        <span style={{
                          padding: '4px 10px', borderRadius: 6,
                          background: cs.bg, border: `1px solid ${cs.border}`,
                          color: cs.color, fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600, whiteSpace: 'nowrap'
                        }}>{r.category}</span>
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
