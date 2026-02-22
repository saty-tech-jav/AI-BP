import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { readingsAPI } from '../services/api';
import { getCategoryStyle } from '../utils/helpers';

function classifyBP(sys, dia) {
  if (sys >= 180 || dia >= 120) return 'Hypertensive Crisis';
  if (sys >= 140 || dia >= 90)  return 'High Stage 2';
  if (sys >= 130 || dia >= 80)  return 'High Stage 1';
  if (sys >= 120 && dia < 80)   return 'Elevated';
  if (sys < 90  || dia < 60)    return 'Low';
  return 'Normal';
}

export default function LogPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ systolic:'', diastolic:'', pulse:'', notes:'', recordedAt:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sys = parseInt(form.systolic), dia = parseInt(form.diastolic);
  const preview = (sys > 0 && dia > 0) ? classifyBP(sys, dia) : null;
  const ps = preview ? getCategoryStyle(preview) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await readingsAPI.create({
        systolic: parseInt(form.systolic),
        diastolic: parseInt(form.diastolic),
        pulse: form.pulse ? parseInt(form.pulse) : null,
        notes: form.notes || null,
        recordedAt: form.recordedAt || null,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to save reading');
    } finally {
      setLoading(false);
    }
  };

  const inp = { width:'100%', padding:'12px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--text)', fontSize:15, boxSizing:'border-box', fontFamily:'var(--mono)' };

  return (
    <div style={{ maxWidth:480, margin:'0 auto', padding:'0 4px' }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontWeight:800, fontSize:22, color:'var(--text)', margin:0 }}>Log Reading</h2>
        <p style={{ color:'var(--text3)', fontSize:13, marginTop:4 }}>Record your blood pressure measurement</p>
      </div>
      {error && <div style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.35)', borderRadius:10, padding:'10px 14px', color:'#ef4444', fontSize:13, marginBottom:16 }}>{error}</div>}
      <div className="card" style={{ padding:'24px 20px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            {[['systolic','Systolic (mmHg)','60','250','120'],['diastolic','Diastolic (mmHg)','40','150','80']].map(([key,label,min,max,ph])=>(
              <div key={key}>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</label>
                <input type="number" min={min} max={max} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} required placeholder={ph} style={inp} />
              </div>
            ))}
          </div>
          {preview && (
            <div style={{ marginBottom:14, padding:'10px 14px', borderRadius:10, background:ps.bg, border:`1px solid ${ps.border}`, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>Category:</span>
              <span style={{ fontWeight:700, fontSize:13, color:ps.color }}>{preview}</span>
            </div>
          )}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Pulse (bpm) — optional</label>
            <input type="number" min="30" max="220" value={form.pulse} onChange={e=>setForm(f=>({...f,pulse:e.target.value}))} placeholder="72" style={inp} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Date &amp; Time — optional</label>
            <input type="datetime-local" value={form.recordedAt} onChange={e=>setForm(f=>({...f,recordedAt:e.target.value}))} style={inp} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em' }}>Notes — optional</label>
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="e.g. after exercise, morning reading…" rows={3} style={{ ...inp, fontFamily:'inherit', resize:'vertical' }} />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={()=>navigate(-1)} style={{ flex:1, padding:'12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--text2)', fontWeight:600, fontSize:14, cursor:'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex:2, padding:'12px', borderRadius:10, border:'none', background:'var(--btn-bg)', color:'#fff', fontWeight:700, fontSize:14, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, boxShadow:'var(--btn-shadow)' }}>{loading?'Saving…':'Save Reading'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
