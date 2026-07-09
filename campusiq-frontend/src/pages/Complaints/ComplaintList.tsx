import { useState, useEffect } from 'react';
import API from '../../utils/api';

const ComplaintList = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  // Status update modal state
  const [statusModal, setStatusModal] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

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

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this complaint?')) return;
    try {
      await API.delete(`/complaints/${id}`);
      fetchComplaints();
    } catch (err) {
      console.error(err);
    }
  };

  // Only allow moving forward one step at a time: Assigned -> In Progress -> Completed
  const getNextStatuses = (status: string) => {
    if (status === 'Assigned') return ['In Progress'];
    if (status === 'In Progress') return ['Completed'];
    return [];
  };

  const openStatusModal = (complaint: any) => {
    const nextOptions = getNextStatuses(complaint.status);
    if (nextOptions.length === 0) return;
    setStatusModal(complaint);
    setNewStatus(nextOptions[0]);
    setAfterPhoto(null);
  };

  const closeStatusModal = () => {
    setStatusModal(null);
    setNewStatus('');
    setAfterPhoto(null);
  };

  const handleStatusSubmit = async () => {
    if (!statusModal) return;

    if (newStatus === 'Completed' && !afterPhoto) {
      alert('Please attach a proof photo before marking this complaint as Completed.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);
      if (afterPhoto) formData.append('after_photo', afterPhoto);

      await API.put(`/complaints/${statusModal.id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      closeStatusModal();
      fetchComplaints();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = complaints.filter(c => {
    const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.complaint_id?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const getPriorityStyle = (priority: string) => {
    if (priority === 'Critical') return { background: '#fee2e2', color: '#dc2626' };
    if (priority === 'High') return { background: '#fee2e2', color: '#dc2626' };
    if (priority === 'Medium') return { background: '#fef3c7', color: '#d97706' };
    return { background: '#f0fdf4', color: '#16a34a' };
  };

  const getStatusStyle = (status: string) => {
    if (status === 'Completed') return { background: '#f0fdf4', color: '#16a34a' };
    if (status === 'Pending') return { background: '#fef3c7', color: '#d97706' };
    if (status === 'In Progress') return { background: '#f5f3ff', color: '#7c3aed' };
    return { background: '#eff6ff', color: '#2563eb' };
  };

  // Target resolution windows (SLA) by priority — how long a complaint of
  // each priority should reasonably take to resolve. Computed live from
  // created_at, no schema change needed.
  const SLA_DAYS: { [key: string]: number } = { Critical: 1, High: 3, Medium: 7, Low: 14 };

  const getSLAInfo = (complaint: any) => {
    const slaDays = SLA_DAYS[complaint.priority] ?? 7;
    const createdAt = new Date(complaint.created_at);
    const dueDate = new Date(createdAt.getTime() + slaDays * 24 * 60 * 60 * 1000);

    if (complaint.status === 'Completed') {
      const resolvedAt = complaint.resolved_at ? new Date(complaint.resolved_at) : null;
      if (!resolvedAt) return { label: 'Resolved', color: '#16a34a', bg: '#f0fdf4' };
      const onTime = resolvedAt <= dueDate;
      return onTime
        ? { label: '✓ Resolved on time', color: '#16a34a', bg: '#f0fdf4' }
        : { label: '⚠ Resolved late', color: '#d97706', bg: '#fef3c7' };
    }

    const now = new Date();
    const msLeft = dueDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

    if (daysLeft < 0) return { label: `Overdue by ${Math.abs(daysLeft)}d`, color: '#dc2626', bg: '#fee2e2' };
    if (daysLeft === 0) return { label: 'Due today', color: '#dc2626', bg: '#fee2e2' };
    return { label: `${daysLeft}d left`, color: '#2563eb', bg: '#eff6ff' };
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <p style={{ color: '#6b7280' }}>Loading complaints...</p>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Complaint List</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          All campus complaints with AI classification
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['All', 'Pending', 'Assigned', 'In Progress', 'Completed'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              background: filter === s ? '#2563eb' : '#f3f4f6',
              color: filter === s ? 'white' : '#4b5563',
            }}
          >
            {s} {s === 'All' ? `(${complaints.length})` : `(${complaints.filter(c => c.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search complaints..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '10px 16px', border: '1px solid #e5e7eb',
            borderRadius: '8px', fontSize: '14px',
            width: '300px', outline: 'none'
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['ID', 'Title', 'Category', 'Priority', 'Status', 'Target', 'AI Confidence', 'Date', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((c: any) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>{c.complaint_id}</td>
                <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '600', color: '#111827', maxWidth: '200px' }}>{c.title}</td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#6b7280' }}>{c.category || c.ai_category || '—'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', fontWeight: '500', ...getPriorityStyle(c.priority) }}>
                    {c.priority}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', fontWeight: '500', ...getStatusStyle(c.status) }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {(() => {
                    const sla = getSLAInfo(c);
                    return (
                      <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '600', background: sla.bg, color: sla.color }}>
                        {sla.label}
                      </span>
                    );
                  })()}
                </td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#6b7280' }}>
                  {c.ai_confidence ? `${c.ai_confidence}%` : '—'}
                </td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#6b7280' }}>
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {getNextStatuses(c.status).length > 0 && (
                      <button
                        onClick={() => openStatusModal(c)}
                        style={{
                          fontSize: '12px', padding: '5px 10px', borderRadius: '6px',
                          background: '#eff6ff', color: '#2563eb', border: 'none',
                          cursor: 'pointer', fontWeight: '500'
                        }}
                      >
                        Update Status
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{
                        fontSize: '12px', padding: '5px 10px', borderRadius: '6px',
                        background: '#fee2e2', color: '#dc2626', border: 'none',
                        cursor: 'pointer', fontWeight: '500'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                  No complaints found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Update Status Modal */}
      {statusModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
          }}
          onClick={closeStatusModal}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: '12px', padding: '24px',
              width: '360px', maxWidth: '90vw'
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
              Update Status
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              {statusModal.complaint_id} — {statusModal.title}
            </p>

            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
              New Status
            </label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: '8px',
                border: '1px solid #e5e7eb', fontSize: '14px', marginBottom: '16px'
              }}
            >
              {getNextStatuses(statusModal.status).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {newStatus === 'Completed' && (
              <>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                  Proof Photo (after completion) — required
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setAfterPhoto(e.target.files ? e.target.files[0] : null)}
                  style={{ marginBottom: '16px', fontSize: '13px' }}
                />
              </>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeStatusModal}
                style={{
                  padding: '8px 14px', borderRadius: '8px', border: '1px solid #e5e7eb',
                  background: 'white', color: '#374151', fontSize: '13px', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusSubmit}
                disabled={submitting || (newStatus === 'Completed' && !afterPhoto)}
                style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none',
                  background: '#2563eb', color: 'white', fontSize: '13px',
                  cursor: (submitting || (newStatus === 'Completed' && !afterPhoto)) ? 'not-allowed' : 'pointer',
                  opacity: (submitting || (newStatus === 'Completed' && !afterPhoto)) ? 0.6 : 1
                }}
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintList;