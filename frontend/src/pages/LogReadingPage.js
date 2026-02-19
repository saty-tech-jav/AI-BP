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

const InputTab = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
    background: active ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'var(--bg3)',
    color: active ? 'white' : 'var(--text2)', transition: 'all 0.2s',
  }}>{children}</button>
);

// Get local datetime string in format "YYYY-MM-DDTHH:mm" without any UTC conversion
const getLocalDateTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function LogReadingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('manual');
  const [form, setForm] = useState({ systolic: '', diastolic: '', pulse: '', notes: '', recordedAt: '' });
  const [voiceText, setVoiceText] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  // Set default datetime using local time (no UTC shift)
  useEffect(() => {
    setForm(f => ({ ...f, recordedAt: getLocalDateTimeString() }));
  }, []);

  const getPreviewCategory = () => {
    const sys = parseInt(form.systolic);
    const dia = parseInt(form.diastolic);
    if (!sys || !dia) return null;
    if (sys > 180 || dia > 120) return 'Hypertensive Crisis';
    if (sys >= 140 || dia >= 90) return 'High BP Stage 2';
    if (sys >= 130 || dia >= 80) return 'High BP Stage 1';
    if (sys >= 120 && dia < 80) return 'Elevated';
    return 'Normal';
  };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError('Voice not supported in this browser. Try Chrome or Edge.'); return; }
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const spoken = e.results[0][0].transcript;
      setVoiceText(spoken);
      parseAndPreview(spoken);
    };
    recognition.onerror = (e) => { setError('Voice error: ' + e.error); setListening(false); };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
    setError('');
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const parseAndPreview = async (text) => {
    if (!text.trim()) return;
    try {
      const res = await readingsAPI.parseVoice(text);
      setParsedPreview(res.data);
      if (res.data.success) {
        setForm(f => ({
          ...f,
          systolic: res.data.systolic || '',
          diastolic: res.data.diastolic || '',
          pulse: res.data.pulse || '',
        }));
      }
    } catch (e) {
      setError('Parse failed');
    }
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      // Send recordedAt exactly as the user selected — no UTC conversion
      // Format: "YYYY-MM-DDTHH:mm" → "YYYY-MM-DDTHH:mm:ss" (just append seconds)
      const recordedAt = form.recordedAt ? `${form.recordedAt}:00` : null;

      const payload = {
        systolic: parseInt(form.systolic),
        diastolic: parseInt(form.diastolic),
        pulse: form.pulse ? parseInt(form.pulse) : null,
        notes: form.notes,
        recordedAt,
        readingType: tab === 'manual' ? 'MANUAL' : 'TEXT',
      };
      await readingsAPI.save(payload);
      setSuccess('Reading saved successfully! ✅');
      setForm(f => ({ ...f, systolic: '', diastolic: '', pulse: '', notes: '', recordedAt: getLocalDateTimeString() }));
      setParsedPreview(null);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save reading');
    } finally { setLoading(false); }
  };

  const previewCategory = getPreviewCategory();
  const previewStyle = previewCategory ? getCategoryStyle(previewCategory) : null;

  return (
    <div className="fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Log BP Reading
        </h1>
        <p style={{ color: 'var(--text3)', marginTop: 4, fontSize: 14 }}>Record manually, by voice, or by typing naturally</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <InputTab active={tab === 'manual'} onClick={() => { setTab('manual'); setParsedPreview(null); }}>✍️ Manual</InputTab>
        <InputTab active={tab === 'voice'} onClick={() => { setTab('voice'); setParsedPreview(null); }}>🎙️ Voice</InputTab>
        <InputTab active={tab === 'text'} onClick={() => { setTab('text'); setParsedPreview(null); }}>💬 Type Naturally</InputTab>
      </div>

      {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#059669', fontSize: 14 }}>{success}</div>}
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>{error}</div>}

      <div className="card">
        {tab === 'voice' && (
          <div>
            <div style={{ textAlign: 'center', padding: '20px 0 32px' }}>
              <button onClick={listening ? stopVoice : startVoice} style={{
                width: 100, height: 100, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: listening
                  ? 'radial-gradient(circle, rgba(239,68,68,0.3), rgba(239,68,68,0.1))'
                  : 'radial-gradient(circle, rgba(59,130,246,0.3), rgba(59,130,246,0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, transition: 'all 0.3s',
                boxShadow: listening ? '0 0 0 10px rgba(239,68,68,0.15), 0 0 0 20px rgba(239,68,68,0.08)' : '0 0 0 10px rgba(59,130,246,0.1)',
                animation: listening ? 'pulse 1.5s infinite' : 'none',
              }}>🎙️</button>
              <p style={{ color: listening ? 'var(--red)' : 'var(--text2)', marginTop: 16, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                {listening ? 'Listening... Speak now' : 'Tap to start speaking'}
              </p>
            </div>
            {voiceText && (
              <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Heard:</div>
                <div style={{ color: 'var(--text)', fontStyle: 'italic' }}>"{voiceText}"</div>
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Try saying:</div>
              {VOICE_EXAMPLES.map((ex, i) => (
                <div key={i} onClick={() => { setVoiceText(ex); parseAndPreview(ex); }}
                  style={{ padding: '8px 14px', background: 'var(--bg3)', borderRadius: 8, marginBottom: 6, cursor: 'pointer', color: 'var(--text2)', fontSize: 13, border: '1px solid transparent', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                  "{ex}"
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'text' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>Type your reading naturally</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" placeholder="e.g. 120 over 80 pulse 72"
                value={voiceText} onChange={e => setVoiceText(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={() => parseAndPreview(voiceText)} style={{ whiteSpace: 'nowrap' }}>Parse</button>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Examples:</div>
              {VOICE_EXAMPLES.map((ex, i) => (
                <span key={i} onClick={() => { setVoiceText(ex); parseAndPreview(ex); }}
                  style={{ display: 'inline-block', padding: '4px 10px', background: 'var(--bg3)', borderRadius: 6, marginRight: 6, marginBottom: 6, cursor: 'pointer', color: 'var(--text3)', fontSize: 12 }}>
                  {ex}
                </span>
              ))}
            </div>
          </div>
        )}

        {parsedPreview && (tab === 'voice' || tab === 'text') && (
          <div style={{
            padding: '16px', borderRadius: 10, marginBottom: 20,
            background: parsedPreview.success ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${parsedPreview.success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}>
            <div style={{ color: parsedPreview.success ? '#059669' : '#dc2626', fontSize: 13, marginBottom: parsedPreview.success ? 10 : 0 }}>
              {parsedPreview.message}
            </div>
            {parsedPreview.success && (
              <div style={{ display: 'flex', gap: 20 }}>
                <div><span style={{ color: 'var(--text3)', fontSize: 12 }}>Systolic </span><strong style={{ color: 'var(--accent)', fontSize: 22, fontFamily: 'var(--font-display)' }}>{parsedPreview.systolic}</strong></div>
                <div><span style={{ color: 'var(--text3)', fontSize: 12 }}>Diastolic </span><strong style={{ color: 'var(--accent2)', fontSize: 22, fontFamily: 'var(--font-display)' }}>{parsedPreview.diastolic}</strong></div>
                {parsedPreview.pulse && <div><span style={{ color: 'var(--text3)', fontSize: 12 }}>Pulse </span><strong style={{ color: 'var(--accent3)', fontSize: 22, fontFamily: 'var(--font-display)' }}>{parsedPreview.pulse}</strong></div>}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSaveManual}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Systolic *</label>
              <input className="input" type="number" min="60" max="250" placeholder="120"
                value={form.systolic} onChange={e => setForm(f => ({ ...f, systolic: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diastolic *</label>
              <input className="input" type="number" min="40" max="150" placeholder="80"
                value={form.diastolic} onChange={e => setForm(f => ({ ...f, diastolic: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pulse</label>
              <input className="input" type="number" min="30" max="220" placeholder="72"
                value={form.pulse} onChange={e => setForm(f => ({ ...f, pulse: e.target.value }))} />
            </div>
          </div>

          {previewStyle && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 14,
              background: previewStyle.bg, border: `1px solid ${previewStyle.border}`,
              color: previewStyle.color, fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600
            }}>
              Category: {previewCategory}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Date & Time <span style={{ color: 'var(--text3)', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(your local time)</span>
            </label>
            <input className="input" type="datetime-local"
              value={form.recordedAt}
              onChange={e => setForm(f => ({ ...f, recordedAt: e.target.value }))} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</label>
            <textarea className="input" placeholder="Optional — e.g. after exercise, morning reading..." rows={3}
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              style={{ resize: 'vertical', fontFamily: 'var(--font-body)' }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ flex: 1, fontSize: 15, padding: '13px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving...' : '💾 Save Reading'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}