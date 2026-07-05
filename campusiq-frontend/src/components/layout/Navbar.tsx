import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { User, Moon, Settings, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
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
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, sign out',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div style={{
      height: '64px', background: darkMode ? '#1f2937' : 'white',
      borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 24px'
    }}>
      <div style={{ fontSize: '14px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
        Welcome back,{' '}
        <span style={{ fontWeight: '600', color: darkMode ? '#f9fafb' : '#111827' }}>{user?.name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <NotificationBell />
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '6px 8px', borderRadius: '10px',
            }}
          >
            <span style={{
              fontSize: '12px', background: darkMode ? '#374151' : '#eff6ff',
              color: darkMode ? '#93c5fd' : '#2563eb', padding: '4px 12px',
              borderRadius: '20px', fontWeight: '500',
              textTransform: 'capitalize'
            }}>
              {user?.role?.replace('_', ' ')}
            </span>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: '#2563eb', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: '700'
            }}>
              {initial}
            </div>
            <span style={{ display: 'flex', color: darkMode ? '#9ca3af' : '#6b7280' }}>
              {menuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: '52px', right: 0, zIndex: 100,
              width: '240px', background: darkMode ? '#1f2937' : 'white',
              borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
              overflow: 'hidden'
            }}>
              <div style={{ padding: '16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#f3f4f6'}` }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#f9fafb' : '#111827' }}>{user?.name}</p>
                <p style={{ fontSize: '12px', color: darkMode ? '#9ca3af' : '#6b7280', marginTop: '2px' }}>{user?.email}</p>
              </div>

              <div style={{ padding: '6px' }}>
                <button
                  onClick={() => { setMenuOpen(false); alert('Profile settings page coming soon.'); }}
                  style={menuItemStyle(darkMode)}
                >
                  <User size={16} /> My Profile
                </button>

                <div style={{ ...menuItemStyle(darkMode), justifyContent: 'space-between', cursor: 'default' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Moon size={16} /> Dark Mode
                  </span>
                  <button
                    onClick={toggleDarkMode}
                    style={{
                      width: '38px', height: '22px', borderRadius: '20px', border: 'none',
                      cursor: 'pointer', position: 'relative',
                      background: darkMode ? '#2563eb' : '#d1d5db',
                      transition: 'background 0.2s'
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: '2px', left: darkMode ? '18px' : '2px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: 'white', transition: 'left 0.2s'
                    }} />
                  </button>
                </div>

                <button
                  onClick={() => { setMenuOpen(false); alert('Settings page coming soon.'); }}
                  style={menuItemStyle(darkMode)}
                >
                  <Settings size={16} /> Settings
                </button>
              </div>

              <div style={{ borderTop: `1px solid ${darkMode ? '#374151' : '#f3f4f6'}`, padding: '6px' }}>
                <button
                  onClick={handleLogout}
                  style={{ ...menuItemStyle(darkMode), color: '#dc2626' }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const menuItemStyle = (darkMode: boolean): React.CSSProperties => ({
  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
  padding: '10px 12px', borderRadius: '8px', border: 'none',
  background: 'transparent', cursor: 'pointer', fontSize: '13px',
  color: darkMode ? '#e5e7eb' : '#374151', textAlign: 'left'
});

export default Navbar;