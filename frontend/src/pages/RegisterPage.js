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

export default function RegisterPage() {
  const [form, setForm] = useState({ username:'', email:'', password:'', fullName:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await register(form); navigate('/dashboard'); }
    catch(err) { setError(err.response?.data?.error || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  const field = (key, label, type='text', placeholder) => (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:8 }}>{label}</label>
      <input className="input" type={type} placeholder={placeholder||label} value={form[key]}
        onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
        required={key!=='fullName'}
        autoComplete={key==='password'?'new-password':key} />
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
      <div className="fade-in" style={{ width:'100%', maxWidth:440 }}>
        <AuthLogo />
        <div className="card" style={{ padding:'28px 24px' }}>
          <h2 style={{ fontWeight:700, fontSize:20, marginBottom:24, color:'var(--text)' }}>Create Account</h2>
          {error && (
            <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'12px 16px', marginBottom:20, color:'var(--red)', fontSize:14 }}>{error}</div>
          )}
          <form onSubmit={handleSubmit}>
            {field('fullName','Full Name (Optional)','text','Your name')}
            {field('username','Username','text','Choose a username')}
            {field('email','Email','email','your@email.com')}
            {field('password','Password','password','Min 6 characters')}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%', fontSize:16, marginTop:8, opacity:loading?0.7:1 }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:20, color:'var(--text2)', fontSize:14 }}>
            Already have an account? <Link to="/login" style={{ color:'var(--accent)', textDecoration:'none', fontWeight:700 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}