import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:20 }}>
      <div className="card" style={{ width:'100%', maxWidth:400, padding:'36px 32px' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>❤️</div>
          <h1 style={{ fontWeight:800, fontSize:22, color:'var(--text)', margin:0 }}>VitalsSaathi<span style={{ color:'#ff5f6d' }}>.AI</span></h1>
          <p style={{ color:'var(--text3)', fontSize:13, marginTop:6 }}>Sign in to your account</p>
        </div>
        {error && <div style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.35)', borderRadius:10, padding:'10px 14px', color:'#ef4444', fontSize:13, marginBottom:16 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:6 }}>Username</label>
            <input type="text" value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))} required style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--text)', fontSize:14, boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:6 }}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} required style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--text)', fontSize:14, boxSizing:'border-box' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'var(--btn-bg)', color:'#fff', fontWeight:700, fontSize:15, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--text3)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'var(--accent)', fontWeight:600, textDecoration:'none' }}>Register</Link>
        </p>
      </div>
    </div>
  );
}
