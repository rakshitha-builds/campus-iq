import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../utils/api';
import { toast } from 'react-toastify';

const statusColors: any = {
  Pending: { bg: '#fef3c7', color: '#d97706' },
  Assigned: { bg: '#eff6ff', color: '#2563eb' },
  'In Progress': { bg: '#f5f3ff', color: '#7c3aed' },
  Completed: { bg: '#f0fdf4', color: '#16a34a' },
};

const TrackByToken = () => {
  const { token } = useParams();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);

  useEffect(() => {
    fetchComplaint();
  }, [token]);

  const fetchComplaint = async () => {
    try {
      const res = await API.get(`/complaints/track/${token}`);
      setComplaint(res.data);
      setFeedbackDone(res.data.already_rated);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not find this complaint.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!rating) {
      toast.error('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      await API.post(`/complaints/track/${token}/rate`, { rating, comment });
      toast.success('Thank you for your feedback!');
      setFeedbackDone(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Loading your complaint...</div>
    );
  }

  if (error) {
    return (
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #e5e7eb', maxWidth: '420px', margin: '0 auto' }}>
        <p style={{ fontSize: '32px', marginBottom: '8px' }}>❓</p>
        <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>Link Not Found</h2>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>{error}</p>
      </div>
    );
  }

  const colors = statusColors[complaint.status] || statusColors.Pending;

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e5e7eb', maxWidth: '480px', margin: '0 auto' }}>
      <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{complaint.complaint_id}</p>
      <h2 style={{ fontSize: '19px', fontWeight: '700', color: '#111827', marginBottom: '10px' }}>{complaint.title}</h2>

      <span style={{
        fontSize: '13px', padding: '5px 14px', borderRadius: '20px', fontWeight: '600',
        background: colors.bg, color: colors.color, display: 'inline-block', marginBottom: '18px'
      }}>
        {complaint.status}
      </span>

      <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.8', marginBottom: '20px' }}>
        <div>Reported by: <strong style={{ color: '#374151' }}>{complaint.raised_by_name}</strong></div>
        <div>Category: <strong style={{ color: '#374151' }}>{complaint.category || '—'}</strong></div>
        {complaint.building_name && (
          <div>Location: <strong style={{ color: '#374151' }}>
            {[complaint.floor_name, complaint.block_name, complaint.building_name].filter(Boolean).join(' — ')}
          </strong></div>
        )}
        <div>Submitted: <strong style={{ color: '#374151' }}>{new Date(complaint.created_at).toLocaleString()}</strong></div>
        {complaint.resolved_at && (
          <div>Resolved: <strong style={{ color: '#374151' }}>{new Date(complaint.resolved_at).toLocaleString()}</strong></div>
        )}
      </div>

      {complaint.after_photo_url && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Proof of resolution:</p>
          <img
            src={`${API.defaults.baseURL?.replace('/api', '')}${complaint.after_photo_url}`}
            alt="after"
            style={{ maxWidth: '100%', borderRadius: '10px', border: '1px solid #e5e7eb' }}
          />
        </div>
      )}

      {complaint.status !== 'Completed' && (
        <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            We'll keep working on it. Check back here anytime for updates.
          </p>
        </div>
      )}

      {complaint.status === 'Completed' && feedbackDone && (
        <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#15803d', fontWeight: '500' }}>
            ✓ Thanks — your feedback has already been recorded.
          </p>
        </div>
      )}

      {complaint.status === 'Completed' && !feedbackDone && (
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '18px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
            How did we do?
          </h3>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => setRating(star)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '30px', padding: '2px', color: star <= rating ? '#f59e0b' : '#d1d5db' }}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            placeholder="Any comments about how the issue was resolved? (optional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit', marginBottom: '14px' }}
          />
          <button
            onClick={handleSubmitFeedback}
            disabled={submitting}
            style={{
              width: '100%', padding: '11px', background: submitting ? '#93c5fd' : '#2563eb',
              color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      )}
    </div>
  );
};

export default TrackByToken;