import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const FeedbackReminderBanner = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user?.role !== 'user') return;
    API.get('/complaints').then(res => {
      const unrated = res.data.filter((c: any) =>
        c.status === 'Completed' && c.raised_by === user?.id && !c.already_rated
      );
      setPendingCount(unrated.length);
    }).catch(() => {});
  }, [user]);

  if (user?.role !== 'user' || pendingCount === 0 || dismissed) return null;

  return (
    <div style={{
      background: darkMode ? '#78350f' : '#fffbeb',
      border: `1px solid ${darkMode ? '#92400e' : '#fde68a'}`,
      borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>⭐</span>
        <p style={{ fontSize: '13px', color: darkMode ? '#fef3c7' : '#92400e', fontWeight: '500' }}>
          You have {pendingCount} resolved complaint{pendingCount > 1 ? 's' : ''} awaiting your feedback.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/feedback')}
          style={{ padding: '6px 14px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
        >
          Give Feedback
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          style={{ padding: '6px 8px', background: 'transparent', color: darkMode ? '#fef3c7' : '#92400e', border: 'none', cursor: 'pointer', fontSize: '13px' }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default FeedbackReminderBanner;