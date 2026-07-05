import { useState, useRef, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import { useTheme } from '../../context/ThemeContext';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface Notification {
  id: number;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const NotificationBell = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const { permission, enablePush } = usePushNotifications();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      try {
        await API.put(`/notifications/${n.id}/read`);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
        setUnreadCount(c => Math.max(0, c - 1));
      } catch (err) {
        console.error(err);
      }
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative', background: 'transparent', border: 'none',
          cursor: 'pointer', padding: '8px', borderRadius: '8px',
          display: 'flex', alignItems: 'center'
        }}
      >
        <Bell size={20} color={darkMode ? '#d1d5db' : '#4b5563'} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            background: '#dc2626', color: 'white', borderRadius: '10px',
            fontSize: '10px', fontWeight: '700', minWidth: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '48px', right: 0, zIndex: 100,
          width: '320px', maxHeight: '400px', background: darkMode ? '#1f2937' : 'white',
          borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: `1px solid ${darkMode ? '#374151' : '#f3f4f6'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#f9fafb' : '#111827' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{ fontSize: '11px', color: '#2563eb', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {permission !== 'granted' && (
            <button
              onClick={enablePush}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                padding: '10px 16px', background: darkMode ? '#1e3a5f' : '#eff6ff',
                border: 'none', borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                cursor: 'pointer', textAlign: 'left'
              }}
            >
              <BellRing size={16} color={darkMode ? '#93c5fd' : '#2563eb'} />
              <span style={{ fontSize: '12px', color: darkMode ? '#93c5fd' : '#2563eb', fontWeight: '500' }}>
                {permission === 'denied'
                  ? 'Notifications blocked — enable in browser site settings'
                  : 'Enable browser push notifications'}
              </span>
            </button>
          )}

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: darkMode ? '#6b7280' : '#9ca3af', fontSize: '13px' }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none',
                    borderBottom: `1px solid ${darkMode ? '#374151' : '#f3f4f6'}`,
                    background: n.is_read ? 'transparent' : (darkMode ? '#1e3a5f33' : '#eff6ff'),
                    cursor: 'pointer', display: 'block'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    {!n.is_read && (
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb', marginTop: '5px', flexShrink: 0 }} />
                    )}
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: n.is_read ? '500' : '600', color: darkMode ? '#f3f4f6' : '#111827' }}>
                        {n.title}
                      </p>
                      <p style={{ fontSize: '12px', color: darkMode ? '#9ca3af' : '#6b7280', marginTop: '2px' }}>
                        {n.message}
                      </p>
                      <p style={{ fontSize: '11px', color: darkMode ? '#6b7280' : '#9ca3af', marginTop: '4px' }}>
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;