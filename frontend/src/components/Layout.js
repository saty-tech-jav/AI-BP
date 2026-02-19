import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: '⚡', label: 'Dashboard' },
  { to: '/log',       icon: '➕', label: 'Log Reading' },
  { to: '/history',   icon: '📋', label: 'History' },
];

const THEMES = [
  { key: 'dark',  icon: '🌙', label: 'Luxury Dark',    sub: 'Navy · Glow · Premium' },
  { key: 'light', icon: '☀️', label: 'Clean Clinical', sub: 'Warm · Editorial · Crisp' },
  { key: 'blue',  icon: '🔷', label: 'Bold Modern',    sub: 'Blue · Vivid · Fresh' },
];

function applyTheme(key) {
  document.documentElement.setAttribute('data-theme', key);
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('bp-theme') || 'dark');

  useEffect(() => { applyTheme(theme); }, []);

  const handleTheme = (key) => {
    setTheme(key);
    localStorage.setItem('bp-theme', key);
    applyTheme(key);
  };

  // On blue theme the sidebar is dark navy so we need light text
  const isDarkSidebar = theme === 'blue';

  const S = {
    logoText:       isDarkSidebar ? '#fff'                    : 'var(--text)',
    logoSub:        isDarkSidebar ? 'rgba(255,255,255,0.28)'  : 'var(--text3)',
    navInactive:    isDarkSidebar ? 'rgba(255,255,255,0.38)'  : 'var(--text2)',
    settingsBtnTxt: isDarkSidebar ? 'rgba(255,255,255,0.45)'  : 'var(--text2)',
    settingsBg:     isDarkSidebar ? 'rgba(255,255,255,0.05)'  : 'var(--bg3)',
    settingsBorder: isDarkSidebar ? 'rgba(255,255,255,0.08)'  : 'var(--border)',
    themeLabel:     isDarkSidebar ? 'rgba(255,255,255,0.28)'  : 'var(--text3)',
    divider:        isDarkSidebar ? 'rgba(255,255,255,0.07)'  : 'var(--border)',
    userName:       isDarkSidebar ? '#fff'                    : 'var(--text)',
    userEmail:      isDarkSidebar ? 'rgba(255,255,255,0.3)'   : 'var(--text3)',
    signoutBorder:  isDarkSidebar ? 'rgba(255,255,255,0.1)'   : 'var(--border)',
    signoutTxt:     isDarkSidebar ? 'rgba(255,255,255,0.4)'   : 'var(--text2)',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ────── SIDEBAR ────── */}
      <aside className="sidebar" style={{
        width: 234,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex', flexDirection: 'column',
        padding: '26px 0 22px',
        position: 'fixed', height: '100vh', zIndex: 100,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}>

        {/* Logo */}
        <div style={{ padding: '0 20px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, animation: 'heartbeat 2s infinite',
            }}>❤️</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: S.logoText, letterSpacing: '-0.025em', lineHeight: 1.1 }}>VitalTrack</div>
              <div style={{ fontSize: 9, color: S.logoSub, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>BP Monitor</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 10px' }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '11px 13px', borderRadius: 'var(--radius-sm)', marginBottom: 2,
              textDecoration: 'none',
              color: isActive ? 'var(--nav-active-color)' : S.navInactive,
              background: isActive ? 'var(--nav-active-bg)' : 'transparent',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
              border: isActive ? '1px solid var(--nav-active-border)' : '1px solid transparent',
              transition: 'all 0.2s',
            })}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Settings */}
        <div style={{ padding: '0 10px', marginBottom: 14 }}>
          <button onClick={() => setShowSettings(s => !s)} style={{
            width: '100%', padding: '10px 13px', borderRadius: 'var(--radius-sm)',
            border: `1px solid ${S.settingsBorder}`,
            background: showSettings ? S.settingsBg : 'transparent',
            color: showSettings ? (isDarkSidebar ? 'rgba(255,255,255,0.8)' : 'var(--text)') : S.settingsBtnTxt,
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 15 }}>⚙️</span>
            <span>Settings</span>
            <span style={{ marginLeft: 'auto', fontSize: 9, opacity: 0.45 }}>{showSettings ? '▲' : '▼'}</span>
          </button>

          {showSettings && (
            <div style={{
              background: S.settingsBg, borderRadius: 'var(--radius-sm)',
              padding: 12, border: `1px solid ${S.settingsBorder}`, marginTop: 6,
            }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: S.themeLabel, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                Theme
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {THEMES.map(t => {
                  const isActive = theme === t.key;
                  return (
                    <button key={t.key} onClick={() => handleTheme(t.key)} style={{
                      padding: '9px 11px', borderRadius: 7,
                      border: isActive ? '1px solid var(--accent)' : `1px solid ${S.settingsBorder}`,
                      cursor: 'pointer', fontFamily: 'var(--font-display)',
                      background: isActive ? 'var(--btn-primary-bg)' : 'transparent',
                      color: isActive ? '#fff' : S.themeLabel,
                      boxShadow: isActive ? 'var(--btn-primary-shadow)' : 'none',
                      transition: 'all 0.2s', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 9,
                    }}>
                      <span style={{ fontSize: 14 }}>{t.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{t.label}</div>
                        <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 400, marginTop: 1 }}>{t.sub}</div>
                      </div>
                      {isActive && <span style={{ marginLeft: 'auto', fontSize: 12 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div style={{ padding: '14px 20px 0', borderTop: `1px solid ${S.divider}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent), var(--accent3))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#fff',
            }}>
              {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: S.userName, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.fullName || user?.username}
              </div>
              <div style={{ fontSize: 10, color: S.userEmail, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            width: '100%', padding: '9px', borderRadius: 'var(--radius-sm)',
            border: `1px solid ${S.signoutBorder}`, background: 'transparent',
            color: S.signoutTxt, fontFamily: 'var(--font-display)', fontWeight: 600,
            fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
          }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Desktop fix */}
      <style>{`
        @media (min-width: 768px) {
          .sidebar { transform: translateX(0) !important; }
          .main-content { margin-left: 234px !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 767px) {
          .main-content { margin-left: 0 !important; }
        }
      `}</style>

      {/* ────── MAIN ────── */}
      <main className="main-content" style={{ flex: 1, minHeight: '100vh' }}>
        {/* Mobile top bar */}
        <div className="mobile-toggle" style={{
          display: 'flex', alignItems: 'center', padding: '13px 18px',
          background: 'var(--topbar-bg)', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button onClick={() => setMobileOpen(v => !v)}
            style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 20, cursor: 'pointer', marginRight: 14, padding: 4 }}>
            ☰
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>❤️ VitalTrack</span>
        </div>

        {mobileOpen && (
          <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
        )}

        <div style={{ padding: '34px 32px', maxWidth: 1060, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}