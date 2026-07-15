import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { User, Moon, LogOut, ChevronDown, ChevronUp, SunMedium } from 'lucide-react';
import Swal from 'sweetalert2';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setMenuOpen(false);
    const result = await Swal.fire({
      title: 'Sign out?',
      text: 'You will need to log in again to access your account.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, sign out',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';
  const roleLabels: { [key: string]: string } = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    user: 'User',
  };
  // A scoped Admin (has a designation, e.g. Electrical) is a specific
  // individual, not a shared account — greet them by name instead of role.
  const greeting = (user as any)?.designation ? user?.name : roleLabels[user?.role || ''];

  return (
    <header style={{
      height: '74px', background: darkMode ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.82)',
      borderBottom: `1px solid ${darkMode ? '#1f2937' : '#dbe7ee'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px',
      backdropFilter: 'blur(18px)', position: 'sticky', top: 0, zIndex: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', minWidth: 0 }}>
        <div>
          <div style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 700 }}>Welcome back</div>
          <div style={{ fontSize: '17px', fontWeight: 900, color: darkMode ? '#f8fafc' : '#0f172a' }}>{greeting}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={toggleDarkMode} title="Toggle theme" style={{
          width: '40px', height: '40px', borderRadius: '13px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
          background: darkMode ? '#172033' : 'white', color: darkMode ? '#f8fafc' : '#0f766e', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {darkMode ? <SunMedium size={18} /> : <Moon size={18} />}
        </button>
        <NotificationBell />
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: '10px', background: darkMode ? '#172033' : 'white',
            border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, cursor: 'pointer', padding: '6px 8px 6px 6px', borderRadius: '999px',
            boxShadow: darkMode ? 'none' : '0 10px 24px rgba(15,23,42,0.06)'
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f766e, #2563eb)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900 }}>{initial}</div>
            <span style={{ fontSize: '12px', color: darkMode ? '#cbd5e1' : '#475569', fontWeight: 800, textTransform: 'capitalize', paddingRight: '2px' }}>{user?.role?.replace('_', ' ')}</span>
            <span style={{ display: 'flex', color: darkMode ? '#94a3b8' : '#64748b' }}>{menuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
          </button>

          {menuOpen && (
            <div style={{ position: 'absolute', top: '54px', right: 0, zIndex: 100, width: '250px', background: darkMode ? '#111827' : 'white', borderRadius: '16px', boxShadow: '0 18px 45px rgba(0,0,0,0.15)', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
              <div style={{ padding: '16px', borderBottom: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}` }}>
                <p style={{ fontSize: '14px', fontWeight: 850, color: darkMode ? '#f8fafc' : '#0f172a' }}>{user?.name}</p>
                <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '3px' }}>{user?.email}</p>
              </div>
              <div style={{ padding: '7px' }}>
                <button onClick={() => { setMenuOpen(false); navigate('/profile'); }} style={menuItemStyle(darkMode)}><User size={16} /> My Profile</button>
                {/* Toggle Theme and Settings temporarily removed — dark mode toggle
                    already exists as its own button next to the bell icon, and
                    Settings has no defined scope yet. Re-add here once decided. */}
              </div>
              <div style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`, padding: '7px' }}>
                <button onClick={handleLogout} style={{ ...menuItemStyle(darkMode), color: '#dc2626' }}><LogOut size={16} /> Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const menuItemStyle = (darkMode: boolean): React.CSSProperties => ({
  width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 12px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: darkMode ? '#e5e7eb' : '#334155', textAlign: 'left'
});

export default Navbar;