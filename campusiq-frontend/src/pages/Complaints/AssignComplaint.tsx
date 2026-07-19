import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { toast } from 'react-toastify';
import { ClipboardList, Sparkles } from 'lucide-react';

const AssignComplaint = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [selectedWorkers, setSelectedWorkers] = useState<{ [key: number]: string }>({});
  const [recommendations, setRecommendations] = useState<{ [complaintId: number]: any[] }>({});
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [c, w] = await Promise.all([
        API.get('/complaints'),
        API.get('/workers'),
      ]);
      const pending = c.data.filter((c: any) => c.status === 'Pending' || c.status === 'Assigned');
      setComplaints(pending);
      setWorkers(w.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI-ranked worker recommendations (lowest workload + highest
  // rating + most experience) for whichever complaints are on the current
  // page — only fetched once per complaint, cached in state.
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(complaints.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageComplaints = complaints.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const toFetch = pageComplaints.filter(c => !recommendations[c.id] && (c.category || c.ai_category));

    if (toFetch.length === 0) return;

    (async () => {
      const results = await Promise.all(
        toFetch.map(c =>
          API.get('/complaints/ai-recommend', { params: { category: c.category || c.ai_category } })
            .then(res => ({ id: c.id, data: res.data.recommended_workers }))
            .catch(() => ({ id: c.id, data: [] }))
        )
      );
      setRecommendations(prev => {
        const next = { ...prev };
        results.forEach(r => { next[r.id] = r.data; });
        return next;
      });
      // Pre-select the top recommended worker, but don't override a choice
      // the admin already made manually.
      setSelectedWorkers(prev => {
        const next = { ...prev };
        results.forEach(r => {
          if (!next[r.id] && r.data.length > 0) next[r.id] = String(r.data[0].id);
        });
        return next;
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaints, page]);

  const handleAssign = async (complaintId: number) => {
    const workerId = selectedWorkers[complaintId];
    if (!workerId) {
      toast.error('Please select a worker first');
      return;
    }
    setAssigning(complaintId);
    try {
      await API.put(`/complaints/${complaintId}/assign`, { worker_id: workerId });
      toast.success('Complaint assigned successfully!');
      fetchData();
    } catch (err) {
      toast.error('Failed to assign complaint');
    } finally {
      setAssigning(null);
    }
  };

  const getPriorityStyle = (priority: string) => {
    if (priority === 'Critical' || priority === 'High') return { background: '#fee2e2', color: '#dc2626' };
    if (priority === 'Medium') return { background: '#fef3c7', color: '#d97706' };
    return { background: '#f0fdf4', color: '#16a34a' };
  };

  const totalPages = Math.max(1, Math.ceil(complaints.length / PAGE_SIZE));
  const paginatedComplaints = complaints.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Assign Complaint</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          AI recommends the best worker based on skill and workload
        </p>
      </div>

      {/* AI Note */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', color: 'white'
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>AI Auto-Assignment Engine</h3>
        <p style={{ fontSize: '13px', color: '#bfdbfe' }}>
          Workers are ranked by: skill match with complaint category + lowest active task count + highest average rating
        </p>
      </div>

      {complaints.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#9ca3af', fontSize: '15px' }}>No pending complaints to assign</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {paginatedComplaints.map((complaint: any) => {
            const recommended = recommendations[complaint.id] || [];
            const topPick = recommended[0];
            const matchedWorkers = workers.filter(w =>
              w.skill?.toLowerCase().includes((complaint.category || '').toLowerCase()) ||
              (complaint.category || '').toLowerCase().includes(w.skill?.toLowerCase())
            );
            const displayWorkers = matchedWorkers.length > 0 ? matchedWorkers : workers;

            return (
              <div key={complaint.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
                {/* Avatar + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: '#eff6ff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0
                  }}>
                    <ClipboardList size={20} color="#2563eb" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {complaint.title}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>{complaint.complaint_id}</p>
                  </div>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', fontWeight: '500', ...getPriorityStyle(complaint.priority) }}>
                    {complaint.priority}
                  </span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', fontWeight: '500' }}>
                    {complaint.status}
                  </span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: '#f9fafb', color: '#6b7280', fontWeight: '500' }}>
                    {complaint.category || complaint.ai_category || 'General'}
                  </span>
                </div>

                {/* AI Recommendation callout */}
                {topPick ? (
                  <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <Sparkles size={13} color="#7c3aed" />
                      <p style={{ fontSize: '12px', fontWeight: '700', color: '#6d28d9' }}>AI Recommends: {topPick.name}</p>
                    </div>
                    <p style={{ fontSize: '11px', color: '#7c3aed' }}>
                      Rating {parseFloat(topPick.avg_rating || 0).toFixed(1)} · {topPick.active_tasks || 0} active task(s) · {topPick.total_resolved || 0} resolved
                    </p>
                  </div>
                ) : matchedWorkers.length > 0 && (
                  <p style={{ fontSize: '11px', color: '#16a34a', marginBottom: '8px' }}>
                    {matchedWorkers.length} worker(s) matched by skill
                  </p>
                )}

                {/* Employee select — locked once already assigned */}
                {complaint.status === 'Assigned' ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                    <p style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600', marginBottom: '2px' }}>Assigned to</p>
                    <p style={{ fontSize: '14px', color: '#111827', fontWeight: '700' }}>
                      {complaint.assigned_worker_name || 'Employee'}
                    </p>
                  </div>
                ) : (
                  <>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Select Employee
                    </label>
                    <select
                      value={selectedWorkers[complaint.id] || ''}
                      onChange={e => setSelectedWorkers(prev => ({ ...prev, [complaint.id]: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none', marginBottom: '12px' }}
                    >
                      <option value="">Select employee</option>
                      {displayWorkers.map((w: any) => {
                        const isTopPick = topPick && String(topPick.id) === String(w.id);
                        return (
                          <option key={w.id} value={w.id}>
                            {isTopPick ? '⭐ ' : ''}{w.name} — {w.skill || 'General'} | Rating: {w.avg_rating || '0'} | Active: {w.pending_count || 0}
                          </option>
                        );
                      })}
                    </select>

                    {/* Assign button */}
                    <button
                      onClick={() => handleAssign(complaint.id)}
                      disabled={assigning === complaint.id}
                      style={{
                        width: '100%', padding: '8px',
                        background: assigning === complaint.id ? '#93c5fd' : '#2563eb',
                        color: 'white', border: 'none', borderRadius: '8px',
                        fontSize: '13px', fontWeight: '500', cursor: 'pointer'
                      }}
                    >
                      {assigning === complaint.id ? 'Assigning...' : 'Assign'}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {complaints.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', marginBottom: '80px' }}>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, complaints.length)} of {complaints.length}
          </p>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb',
                background: 'white', color: page === 1 ? '#d1d5db' : '#374151',
                fontSize: '13px', cursor: page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                  background: page === p ? '#2563eb' : '#f3f4f6',
                  color: page === p ? 'white' : '#4b5563',
                  fontSize: '13px', fontWeight: '500', cursor: 'pointer'
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb',
                background: 'white', color: page === totalPages ? '#d1d5db' : '#374151',
                fontSize: '13px', cursor: page === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignComplaint;