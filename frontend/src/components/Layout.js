import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: '⚡', label: 'Dashboard' },
  { to: '/log',       icon: '➕', label: 'Log'        },
  { to: '/history',   icon: '📋', label: 'History'    },
];

const THEMES = [
  { key: 'dark',  icon: '🌙', label: 'Dark'  },
  { key: 'light', icon: '☀️', label: 'Light' },
  { key: 'blue',  icon: '🔷', label: 'Blue'  },
];

function applyTheme(key) {
  document.documentElement.setAttribute('data-theme', key);
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('bp-theme') || 'dark');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => { applyTheme(theme); }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setShowInstallBtn(false));
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBtn(false);
    setInstallPrompt(null);
  };

  useEffect(() => {
    const fn = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleTheme = (key) => {
    setTheme(key);
    localStorage.setItem('bp-theme', key);
    applyTheme(key);
  };

  const cycleTheme = () => {
    const keys = ['dark', 'light', 'blue'];
    const next = keys[(keys.indexOf(theme) + 1) % 3];
    handleTheme(next);
  };

  const doLogout = () => {
    if (window.confirm('Sign out?')) { logout(); navigate('/login'); }
  };

  const hasDarkSidebar = theme !== 'light';
  const sidebarTextColor = hasDarkSidebar ? '#f0f4ff' : '#1c1209';
  const sidebarSubColor = hasDarkSidebar ? 'rgba(255,255,255,0.45)' : '#a8927a';
  const sidebarBorder = hasDarkSidebar ? 'rgba(255,255,255,0.1)' : 'var(--border)';

  const Logo = ({ size = 'md' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: size === 'sm' ? 8 : 12 }}>
      <div style={{
        width: size === 'sm' ? 30 : 40, height: size === 'sm' ? 30 : 40,
        borderRadius: size === 'sm' ? 9 : 12, flexShrink: 0,
        background: 'linear-gradient(145deg,#ff5f6d,#c0392b)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 14px rgba(192,57,43,0.45)',
        animation: 'heartbeat 2s infinite',
      }}>
        <svg width={size === 'sm' ? 15 : 20} height={size === 'sm' ? 15 : 20} viewBox="0 0 24 24" fill="none">
          <path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C14.09 3.81 15.76 3 17.5 3C20.58 3 23 5.42 23 8.5C23 14.5 12 21 12 21Z" fill="white"/>
          <path d="M6 11h2l1.5-3 2 6 1.5-4.5 1 1.5H18" stroke="rgba(255,100,100,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: size === 'sm' ? 14 : 15, color: size === 'sm' ? 'var(--text)' : sidebarTextColor, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          VitalsSaathi<span style={{ color: '#ff5f6d' }}>.AI</span>
        </div>
        {size !== 'sm' && (
          <div style={{ fontSize: 9, color: sidebarSubColor, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 3, fontWeight: 700 }}>BP Monitor</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="app-layout">

      {/* ── SIDEBAR (Desktop always visible / Mobile slide-in) ── */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '0 20px 28px' }}>
          <Logo />
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '0 10px' }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px',
              borderRadius: 10, marginBottom: 3, textDecoration: 'none',
              color: isActive ? 'var(--nav-active)' : sidebarSubColor,
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              fontWeight: 600, fontSize: 14,
              border: isActive ? '1px solid var(--border-strong)' : '1px solid transparent',
              transition: 'all 0.18s',
            })}>
              <span style={{ fontSize: 17, width: 22, textAlign: 'center' }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Theme switcher */}
        <div style={{ padding: '0 10px', marginBottom: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: sidebarSubColor, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, paddingLeft: 4 }}>Theme</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {THEMES.map(t => (
              <button key={t.key} onClick={() => handleTheme(t.key)} style={{
                flex: 1, padding: '8px 4px', borderRadius: 8,
                border: theme === t.key ? '1.5px solid var(--accent)' : `1px solid ${sidebarBorder}`,
                background: theme === t.key ? 'var(--btn-bg)' : 'transparent',
                color: theme === t.key ? '#fff' : sidebarSubColor,
                cursor: 'pointer', fontSize: 11, fontWeight: 600,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                transition: 'all 0.18s',
              }}>
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* User + sign out */}
        <div style={{ padding: '14px 16px 0', borderTop: `1px solid ${sidebarBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,var(--accent),var(--accent3))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 15, color: '#fff',
            }}>
              {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: sidebarTextColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.fullName || user?.username}
              </div>
              <div style={{ fontSize: 10, color: sidebarSubColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            width: '100%', padding: '10px', borderRadius: 10,
            border: `1px solid ${sidebarBorder}`, background: 'transparent',
            color: sidebarSubColor, fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── OVERLAY (mobile) ── */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 199, backdropFilter: 'blur(3px)',
        }} />
      )}

      {/* ── MAIN ── */}
      <main className="main-content">

        {/* Mobile topbar */}
        <div className="mobile-topbar" style={{ display: isMobile ? 'flex' : 'none' }}>
          {/* Hamburger */}
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}>
            <div style={{ width: 18, height: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {[0,1,2].map(i => (
                <span key={i} style={{
                  display: 'block', height: 2, background: 'var(--text)', borderRadius: 2,
                  width: i === 1 ? '70%' : '100%',
                  transform: sidebarOpen
                    ? i === 0 ? 'rotate(45deg) translateY(8px)' : i === 2 ? 'rotate(-45deg) translateY(-8px)' : 'scaleX(0)'
                    : 'none',
                  opacity: sidebarOpen && i === 1 ? 0 : 1,
                  transition: 'all 0.25s',
                }} />
              ))}
            </div>
          </button>

          <Logo size="sm" />

          {/* Right: theme + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {showInstallBtn && (
              <button onClick={handleInstall} style={{
                height: 38, borderRadius: 10, padding: '0 12px',
                background: 'var(--btn-bg)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700, gap: 4,
                boxShadow: 'var(--btn-shadow)',
              }}>
                📲 Install
              </button>
            )}
            <button onClick={cycleTheme} style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16,
            }}>
              {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🔷'}
            </button>
            <button onClick={doLogout} style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none',
              background: 'linear-gradient(135deg,var(--accent),var(--accent3))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14, color: '#fff', cursor: 'pointer', flexShrink: 0,
            }}>
              {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="page-inner">
          <Outlet />
        </div>

        {/* ── MOBILE BOTTOM NAV ── */}
        {isMobile && (
          <nav className="bottom-nav">
            {NAV.map(({ to, icon, label }) => {
              const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
              return (
                <NavLink key={to} to={to} className={`bottom-nav-item${isActive ? ' active' : ''}`}>
                  <span className="icon">{icon}</span>
                  {label}
                </NavLink>
              );
            })}
          </nav>
        )}

      </main>
    </div>
  );
}
