import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Feedback = () => {
  const { user } = useAuth();
  const isPrivileged = user?.role === 'super_admin' || user?.role === 'admin';
  const [complaints, setComplaints] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [ratings, setRatings] = useState<{ [key: number]: { rating: number; comment: string; worker_id: string } }>({});
  const [submitted, setSubmitted] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [c, w] = await Promise.all([
        API.get('/complaints'),
        API.get('/workers'),
      ]);
      const scoped = c.data.filter((c: any) =>
        c.status === 'Completed' && (user?.role !== 'user' || c.raised_by === user?.id)
      );
      setComplaints(scoped);
      setSubmitted(scoped.filter((c: any) => c.already_rated).map((c: any) => c.id));
      setWorkers(w.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = (complaintId: number, field: string, value: any) => {
    setRatings(prev => ({
      ...prev,
      [complaintId]: { ...prev[complaintId], [field]: value }
    }));
  };

  const handleSubmit = async (complaint: any) => {
    const r = ratings[complaint.id];
    if (!r?.rating) { toast.error('Please select a rating'); return; }
    if (!r?.worker_id) { toast.error('Please select the worker'); return; }

    setSubmitting(complaint.id);
    try {
      await API.post(`/complaints/${complaint.id}/rate`, {
        rated_by: user?.id,
        worker_id: r.worker_id,
        rating: r.rating,
        comment: r.comment || '',
      });
      toast.success('Feedback submitted successfully!');
      setSubmitted(prev => [...prev, complaint.id]);
    } catch (err) {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(null);
    }
  };

  const StarRating = ({ complaintId }: { complaintId: number }) => {
    const current = ratings[complaintId]?.rating || 0;
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => handleRating(complaintId, 'rating', star)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '28px', padding: '2px',
              color: star <= current ? '#f59e0b' : '#d1d5db',
              transition: 'color 0.1s'
            }}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating: number) => {
    if (rating === 5) return { label: 'Excellent!', color: '#16a34a' };
    if (rating === 4) return { label: 'Good', color: '#2563eb' };
    if (rating === 3) return { label: 'Average', color: '#d97706' };
    if (rating === 2) return { label: 'Poor', color: '#f59e0b' };
    if (rating === 1) return { label: 'Very Poor', color: '#dc2626' };
    return { label: '', color: '' };
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <p style={{ color: '#6b7280' }}>Loading...</p>
    </div>
  );

  const totalRated = submitted.length;
  const avgRating = Object.values(ratings).filter(r => r.rating).length > 0
    ? (Object.values(ratings).reduce((a, r) => a + (r.rating || 0), 0) / Object.values(ratings).filter(r => r.rating).length).toFixed(1)
    : '0';

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Feedback & Rating System</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          Rate resolved complaints — AI analyzes sentiment to improve service quality
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Completed Complaints', value: complaints.length, color: '#2563eb' },
          { label: 'Feedback Given', value: totalRated, color: '#16a34a' },
          { label: 'Pending Feedback', value: Math.max(0, complaints.length - totalRated), color: '#d97706' },
          { label: 'Avg Rating', value: avgRating, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, background: 'white', borderRadius: '12px',
            padding: '16px 20px', border: '1px solid #e5e7eb',
            borderLeft: `4px solid ${s.color}`
          }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* AI Sentiment Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        borderRadius: '12px', padding: '14px 20px', marginBottom: '20px',
        color: 'white', display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <span style={{ fontSize: '20px' }}>🤖</span>
        <div>
          <p style={{ fontSize: '13px', fontWeight: '600' }}>AI Sentiment Analysis Engine</p>
          <p style={{ fontSize: '12px', color: '#bfdbfe' }}>
            Every feedback comment is analyzed for sentiment — positive, negative, or neutral — to improve worker performance scores
          </p>
        </div>
      </div>

      {/* Complaints to rate */}
      {complaints.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</p>
          <p style={{ color: '#9ca3af', fontSize: '15px' }}>No completed complaints to rate yet</p>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>Complaints appear here once they are marked as Completed</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {complaints.map((complaint: any) => {
            const isSubmitted = submitted.includes(complaint.id);
            const currentRating = ratings[complaint.id]?.rating || 0;
            const ratingInfo = getRatingLabel(currentRating);

            return (
              <div key={complaint.id} style={{
                background: 'white', borderRadius: '12px', padding: '20px',
                border: `1px solid ${isSubmitted ? '#86efac' : '#e5e7eb'}`,
                borderLeft: `4px solid ${isSubmitted ? '#16a34a' : '#2563eb'}`
              }}>
                {/* Complaint Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>{complaint.complaint_id}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', fontWeight: '500' }}>
                        Completed
                      </span>
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>{complaint.title}</h3>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>
                      Category: {complaint.category || '—'} · Resolved: {complaint.resolved_at ? new Date(complaint.resolved_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {isSubmitted && (
                    <span style={{
                      fontSize: '12px', padding: '6px 14px', borderRadius: '20px',
                      background: '#f0fdf4', color: '#16a34a', fontWeight: '600'
                    }}>
                      ✓ Feedback Submitted
                    </span>
                  )}
                </div>

                {!isSubmitted ? (
                  <div>
                    {/* Star Rating */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                        Rate the service quality
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <StarRating complaintId={complaint.id} />
                        {currentRating > 0 && (
                          <span style={{ fontSize: '13px', fontWeight: '600', color: ratingInfo.color }}>
                            {ratingInfo.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Worker Select */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Which worker resolved your complaint?
                      </label>
                      <select
                        value={ratings[complaint.id]?.worker_id || ''}
                        onChange={e => handleRating(complaint.id, 'worker_id', e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                      >
                        <option value="">Select worker</option>
                        {workers.map(w => (
                          <option key={w.id} value={w.id}>{w.name} — {w.skill}</option>
                        ))}
                      </select>
                    </div>

                    {/* Comment */}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Comment (AI will analyze sentiment)
                      </label>
                      <textarea
                        placeholder="Describe your experience... e.g. The worker was very professional and fixed the issue quickly."
                        value={ratings[complaint.id]?.comment || ''}
                        onChange={e => handleRating(complaint.id, 'comment', e.target.value)}
                        rows={2}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                      />
                    </div>

                    <button
                      onClick={() => handleSubmit(complaint)}
                      disabled={submitting === complaint.id}
                      style={{
                        padding: '10px 24px', background: submitting === complaint.id ? '#93c5fd' : '#2563eb',
                        color: 'white', border: 'none', borderRadius: '8px',
                        fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                      }}
                    >
                      {submitting === complaint.id ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </div>
                ) : (
                  <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '12px 16px' }}>
                    <p style={{ fontSize: '13px', color: '#15803d', fontWeight: '500' }}>
                      ✓ Thank you for your feedback! AI sentiment analysis has been applied to improve worker performance scores.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Feedback;