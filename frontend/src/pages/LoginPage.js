import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthLogo() {
  return (
    <div style={{ textAlign:'center', marginBottom:36 }}>
      <div style={{ width:80, height:80, borderRadius:24, margin:'0 auto 18px', background:'linear-gradient(145deg,#ff5f6d,#c0392b)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 10px 36px rgba(192,57,43,0.45)', animation:'heartbeat 1.8s infinite' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z" fill="white" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
          <path d="M5.5 11h2.5l1.5-3 2.5 7 2-5 1 1H19" stroke="rgba(220,60,60,0.85)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h1 style={{ fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em', lineHeight:1 }}>
        VitalsSaathi<span style={{ color:'#ff5f6d' }}>.AI</span>
      </h1>
      <p style={{ color:'var(--text2)', marginTop:8, fontSize:14 }}>Your intelligent health companion</p>
    </div>
  );
}

export default function LoginPage() {
  const [form, setForm] = useState({ username:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await login(form.username, form.password); navigate('/dashboard'); }
    catch(err) { setError(err.response?.data?.error || 'Login failed. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }} />
      <div className="fade-in" style={{ width:'100%', maxWidth:420, position:'relative' }}>
        <AuthLogo />
        <div className="card" style={{ padding:'28px 24px' }}>
          <h2 style={{ fontWeight:700, fontSize:20, marginBottom:24, color:'var(--text)' }}>Sign In</h2>
          {error && (
            <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'12px 16px', marginBottom:20, color:'var(--red)', fontSize:14 }}>{error}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:8 }}>Username</label>
              <input className="input" placeholder="Enter username" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} required autoComplete="username" />
            </div>
            <div style={{ marginBottom:28 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:8 }}>Password</label>
              <input className="input" type="password" placeholder="Enter password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required autoComplete="current-password" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%', fontSize:16, opacity:loading?0.7:1 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:20, color:'var(--text2)', fontSize:14 }}>
            No account? <Link to="/register" style={{ color:'var(--accent)', textDecoration:'none', fontWeight:700 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}