import React, { useState, useRef, useEffect } from 'react';
import { readingsAPI } from '../services/api';
import { getCategoryStyle } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const VOICE_EXAMPLES = [
  '120 over 80 pulse 72',
  '135/90 heart rate 68',
  'systolic 118 diastolic 76 pulse 80',
  'BP 125 by 82 pulse rate 70',
];

const getLocalDateTimeString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
};

const getPreviewCategory = (sys, dia) => {
  if (!sys || !dia) return null;
  if (sys > 180 || dia > 120) return 'Hypertensive Crisis';
  if (sys >= 140 || dia >= 90) return 'High BP Stage 2';
  if (sys >= 130 || dia >= 80) return 'High BP Stage 1';
  if (sys >= 120 && dia < 80)  return 'Elevated';
  return 'Normal';
};

export default function LogReadingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('manual');
  const [form, setForm] = useState({ systolic:'', diastolic:'', pulse:'', notes:'', recordedAt:'' });
  const [voiceText, setVoiceText] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    setForm(f => ({ ...f, recordedAt: getLocalDateTimeString() }));
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError('Voice not supported. Try Chrome or Edge.'); return; }
    const recognition = new SR();
    recognition.lang = 'en-US'; recognition.interimResults = false; recognition.maxAlternatives = 1;
    recognition.onresult = (e) => { const spoken = e.results[0][0].transcript; setVoiceText(spoken); parseAndPreview(spoken); };
    recognition.onerror = (e) => { setError('Voice error: ' + e.error); setListening(false); };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true); setError('');
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setListening(false); };

  const parseAndPreview = async (text) => {
    if (!text.trim()) return;
    try {
      const res = await readingsAPI.parseVoice(text);
      setParsedPreview(res.data);
      if (res.data.success) setForm(f => ({ ...f, systolic:res.data.systolic||'', diastolic:res.data.diastolic||'', pulse:res.data.pulse||'' }));
    } catch(e) { setError('Parse failed'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await readingsAPI.save({
        systolic: parseInt(form.systolic),
        diastolic: parseInt(form.diastolic),
        pulse: form.pulse ? parseInt(form.pulse) : null,
        notes: form.notes,
        recordedAt: form.recordedAt ? `${form.recordedAt}:00` : null,
        readingType: tab === 'manual' ? 'MANUAL' : 'TEXT',
      });
      setSuccess('Reading saved! ✅');
      setForm(f => ({ ...f, systolic:'', diastolic:'', pulse:'', notes:'', recordedAt:getLocalDateTimeString() }));
      setParsedPreview(null);
      setTimeout(() => navigate('/dashboard'), 1400);
    } catch(e) {
      setError(e.response?.data?.error || 'Failed to save reading');
    } finally { setLoading(false); }
  };

  const previewCat = getPreviewCategory(parseInt(form.systolic), parseInt(form.diastolic));
  const previewStyle = previewCat ? getCategoryStyle(previewCat) : null;

  const TAB_STYLE = (active) => ({
    flex:1, padding: isMobile ? '14px 8px' : '12px 16px',
    borderRadius:10, border:'none', cursor:'pointer',
    fontWeight:700, fontSize: isMobile ? 14 : 13,
    background: active ? 'var(--btn-bg)' : 'var(--bg3)',
    color: active ? 'white' : 'var(--text2)',
    transition:'all 0.18s', minHeight: isMobile ? 52 : 44,
  });

  const LABEL = { display:'block', fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: isMobile ? 20 : 28 }}>
        <h1 style={{ fontWeight:800, fontSize: isMobile ? 26 : 30, color:'var(--text)', letterSpacing:'-0.02em' }}>Log Reading</h1>
        <p style={{ color:'var(--text3)', marginTop:4, fontSize:13 }}>Manual, voice, or type naturally</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom: isMobile ? 20 : 22 }}>
        <button style={TAB_STYLE(tab==='manual')} onClick={() => { setTab('manual'); setParsedPreview(null); }}>✍️ Manual</button>
        <button style={TAB_STYLE(tab==='voice')} onClick={() => { setTab('voice'); setParsedPreview(null); }}>🎙️ Voice</button>
        <button style={TAB_STYLE(tab==='text')} onClick={() => { setTab('text'); setParsedPreview(null); }}>💬 Type</button>
      </div>

      {success && <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'14px 16px', marginBottom:16, color:'var(--green)', fontSize:14, fontWeight:600 }}>{success}</div>}
      {error   && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:12, padding:'14px 16px', marginBottom:16, color:'var(--red)', fontSize:14 }}>{error}</div>}

      <div className="card" style={{ padding: isMobile ? '20px 16px' : '28px 26px' }}>

        {/* Voice tab */}
        {tab === 'voice' && (
          <div>
            <div style={{ textAlign:'center', padding: isMobile ? '24px 0 28px' : '16px 0 24px' }}>
              <button onClick={listening ? stopVoice : startVoice} style={{
                width: isMobile ? 110 : 100, height: isMobile ? 110 : 100, borderRadius:'50%', border:'none', cursor:'pointer',
                background: listening ? 'radial-gradient(circle, rgba(239,68,68,0.25), rgba(239,68,68,0.06))' : 'radial-gradient(circle, rgba(99,102,241,0.25), rgba(99,102,241,0.06))',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize: isMobile ? 42 : 36,
                boxShadow: listening ? '0 0 0 12px rgba(239,68,68,0.12), 0 0 0 24px rgba(239,68,68,0.06)' : '0 0 0 12px rgba(99,102,241,0.1)',
                transition:'all 0.3s',
              }}>🎙️</button>
              <p style={{ color: listening?'var(--red)':'var(--text2)', marginTop:18, fontWeight:600, fontSize: isMobile ? 16 : 14 }}>
                {listening ? '🔴 Listening... speak now' : 'Tap to start speaking'}
              </p>
            </div>
            {voiceText && (
              <div style={{ marginBottom:20, padding:'14px 16px', background:'var(--bg3)', borderRadius:12, border:'1px solid var(--border)' }}>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4, fontWeight:600 }}>Heard:</div>
                <div style={{ color:'var(--text)', fontStyle:'italic', fontSize:15 }}>"{voiceText}"</div>
              </div>
            )}
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Try saying:</div>
            {VOICE_EXAMPLES.map((ex,i) => (
              <div key={i} onClick={() => { setVoiceText(ex); parseAndPreview(ex); }}
                style={{ padding:'13px 16px', background:'var(--bg3)', borderRadius:10, marginBottom:8, cursor:'pointer', color:'var(--text2)', fontSize: isMobile?14:13, border:'1px solid var(--border)', minHeight:48, display:'flex', alignItems:'center' }}>
                "{ex}"
              </div>
            ))}
          </div>
        )}

        {/* Text tab */}
        {tab === 'text' && (
          <div style={{ marginBottom:20 }}>
            <label style={LABEL}>Type your reading</label>
            <div style={{ display:'flex', gap:10, marginBottom:14 }}>
              <input className="input" placeholder="e.g. 120 over 80 pulse 72" value={voiceText} onChange={e=>setVoiceText(e.target.value)} style={{ flex:1 }} />
              <button className="btn btn-primary btn-sm" onClick={() => parseAndPreview(voiceText)} style={{ flexShrink:0 }}>Parse</button>
            </div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:10, fontWeight:600 }}>Examples:</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {VOICE_EXAMPLES.map((ex,i) => (
                <span key={i} onClick={() => { setVoiceText(ex); parseAndPreview(ex); }}
                  style={{ padding:'8px 12px', background:'var(--bg3)', borderRadius:8, cursor:'pointer', color:'var(--text3)', fontSize:12, border:'1px solid var(--border)' }}>
                  {ex}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Parsed preview */}
        {parsedPreview && (tab==='voice'||tab==='text') && (
          <div style={{ padding:'16px', borderRadius:12, marginBottom:20, background:parsedPreview.success?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)', border:`1px solid ${parsedPreview.success?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'}` }}>
            <div style={{ color:parsedPreview.success?'var(--green)':'var(--red)', fontSize:13, marginBottom:parsedPreview.success?12:0, fontWeight:600 }}>{parsedPreview.message}</div>
            {parsedPreview.success && (
              <div style={{ display:'flex', gap:24 }}>
                {[['Systolic',parsedPreview.systolic,'var(--val-sys)'],['Diastolic',parsedPreview.diastolic,'var(--val-dia)'],parsedPreview.pulse?['Pulse',parsedPreview.pulse,'var(--val-pulse)']:null].filter(Boolean).map(([l,v,c]) => (
                  <div key={l}><div style={{ color:'var(--text3)', fontSize:11, marginBottom:2 }}>{l}</div><strong style={{ color:c, fontSize:28, fontWeight:800 }}>{v}</strong></div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual form — always shown */}
        <form onSubmit={handleSave}>
          {/* BP inputs — stacked on mobile, 3-col on desktop */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 14, marginBottom:14 }}>
            <div>
              <label style={LABEL}>Systolic *</label>
              <input className="input" type="number" min="60" max="250" placeholder="120" value={form.systolic} onChange={e=>setForm(f=>({...f,systolic:e.target.value}))} required />
            </div>
            <div>
              <label style={LABEL}>Diastolic *</label>
              <input className="input" type="number" min="40" max="150" placeholder="80" value={form.diastolic} onChange={e=>setForm(f=>({...f,diastolic:e.target.value}))} required />
            </div>
            <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
              <label style={LABEL}>Pulse (bpm)</label>
              <input className="input" type="number" min="30" max="220" placeholder="72" value={form.pulse} onChange={e=>setForm(f=>({...f,pulse:e.target.value}))} />
            </div>
          </div>

          {/* Category preview */}
          {previewStyle && (
            <div style={{ padding:'12px 16px', borderRadius:10, marginBottom:14, background:previewStyle.bg, border:`1px solid ${previewStyle.border}`, color:previewStyle.color, fontSize:14, fontWeight:700 }}>
              {previewCat}
            </div>
          )}

          <div style={{ marginBottom:14 }}>
            <label style={LABEL}>Date & Time <span style={{ textTransform:'none', fontWeight:400 }}>(your local time)</span></label>
            <input className="input" type="datetime-local" value={form.recordedAt} onChange={e=>setForm(f=>({...f,recordedAt:e.target.value}))} />
          </div>

          <div style={{ marginBottom: isMobile ? 24 : 20 }}>
            <label style={LABEL}>Notes (optional)</label>
            <textarea className="input" placeholder="e.g. after exercise, morning reading..." rows={isMobile ? 3 : 3} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{ resize:'vertical', fontFamily:'var(--font)', minHeight: isMobile ? 90 : 80 }} />
          </div>

          <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', gap:10 }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex:1, opacity:loading?0.7:1, fontSize: isMobile ? 16 : 15 }}>
              {loading ? 'Saving...' : '💾 Save Reading'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')} style={{ fontSize: isMobile ? 16 : 15 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}