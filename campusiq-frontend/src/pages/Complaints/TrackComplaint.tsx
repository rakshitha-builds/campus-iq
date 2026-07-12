import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { ClipboardList } from 'lucide-react';

const TrackComplaint = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 4;

  useEffect(() => { fetchComplaints(); }, []);

  const fetchComplaints = async () => {
    try {
      const res = await API.get('/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ['Pending', 'Assigned', 'In Progress', 'Completed'];
    return steps.indexOf(status);
  };

  const getStatusColor = (status: string) => {
    if (status === 'Completed') return '#16a34a';
    if (status === 'In Progress') return '#7c3aed';
    if (status === 'Assigned') return '#2563eb';
    return '#d97706';
  };

  const filtered = complaints.filter(c =>
    c.complaint_id?.toLowerCase().includes(search.toLowerCase()) ||
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <p style={{ color: '#6b7280' }}>Loading...</p>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Track Complaint</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          Real time complaint status tracking with timeline
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '20px' }}>

        {/* Left — List */}
        <div>
          <input
            type="text"
            placeholder="Search by ID or title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', marginBottom: '16px' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr' : 'repeat(3, 1fr)', gap: '14px' }}>
            {paginated.map((c: any) => (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                style={{
                  background: 'white', borderRadius: '12px', padding: '16px',
                  border: `1px solid ${selected?.id === c.id ? '#2563eb' : '#e5e7eb'}`,
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: '#eff6ff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0
                  }}>
                    <ClipboardList size={18} color="#2563eb" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.title}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>{c.complaint_id}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '500',
                    background: c.status === 'Completed' ? '#f0fdf4' : c.status === 'Pending' ? '#fef3c7' : c.status === 'In Progress' ? '#f5f3ff' : '#eff6ff',
                    color: getStatusColor(c.status)
                  }}>
                    {c.status}
                  </span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#f9fafb', color: '#6b7280', fontWeight: '500' }}>
                    {c.category || '—'}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                No complaints found
              </div>
            )}
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', marginBottom: '80px' }}>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '6px 10px', borderRadius: '8px', border: '1px solid #e5e7eb',
                    background: 'white', color: page === 1 ? '#d1d5db' : '#374151',
                    fontSize: '12px', cursor: page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: '28px', height: '28px', borderRadius: '8px', border: 'none',
                      background: page === p ? '#2563eb' : '#f3f4f6',
                      color: page === p ? 'white' : '#4b5563',
                      fontSize: '12px', fontWeight: '500', cursor: 'pointer'
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '6px 10px', borderRadius: '8px', border: '1px solid #e5e7eb',
                    background: 'white', color: page === totalPages ? '#d1d5db' : '#374151',
                    fontSize: '12px', cursor: page === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — Detail + Timeline */}
        {selected && (
          <div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Complaint Details</h3>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '18px' }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'Complaint ID', value: selected.complaint_id },
                  { label: 'Category', value: selected.category || '—' },
                  { label: 'Priority', value: selected.priority },
                  { label: 'Status', value: selected.status },
                  { label: 'Block', value: selected.block_name || '—' },
                  { label: 'Floor', value: selected.floor_name || '—' },
                  { label: 'Assigned To', value: selected.assigned_worker_name || 'Not assigned' },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>{item.label}</p>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* AI Info */}
              {selected.ai_category && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '500', color: '#15803d', marginBottom: '4px' }}>AI Analysis</p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>
                    Category: {selected.ai_category} | Priority: {selected.ai_priority} | Sentiment: {selected.ai_sentiment} | Confidence: {selected.ai_confidence}%
                  </p>
                </div>
              )}

              {/* Photo */}
              {selected.photo_url && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Complaint Photo</p>
                  <img
                    src={`http://localhost:5000${selected.photo_url}`}
                    alt="complaint"
                    style={{ width: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>

            {/* Timeline */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Status Timeline</h3>
              {['Pending', 'Assigned', 'In Progress', 'Completed'].map((step, i) => {
                const currentStep = getStatusStep(selected.status);
                const isDone = i <= currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div key={step} style={{ display: 'flex', gap: '12px', marginBottom: i < 3 ? '0' : '0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: isDone ? getStatusColor(selected.status) : '#f3f4f6',
                        border: `2px solid ${isDone ? getStatusColor(selected.status) : '#e5e7eb'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', color: isDone ? 'white' : '#9ca3af',
                        fontWeight: '600', flexShrink: 0
                      }}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      {i < 3 && (
                        <div style={{
                          width: '2px', height: '32px',
                          background: i < currentStep ? getStatusColor(selected.status) : '#e5e7eb'
                        }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: i < 3 ? '16px' : '0', paddingTop: '4px' }}>
                      <p style={{
                        fontSize: '13px', fontWeight: isCurrent ? '600' : '500',
                        color: isCurrent ? getStatusColor(selected.status) : isDone ? '#111827' : '#9ca3af'
                      }}>
                        {step}
                      </p>
                      <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {step === 'Pending' && new Date(selected.created_at).toLocaleString()}
                        {step === 'Completed' && selected.resolved_at && new Date(selected.resolved_at).toLocaleString()}
                        {isCurrent && step !== 'Pending' && step !== 'Completed' && 'Currently at this stage'}
                        {!isDone && step !== 'Pending' && 'Waiting'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackComplaint;