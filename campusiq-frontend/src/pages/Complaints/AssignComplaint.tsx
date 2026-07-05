import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { toast } from 'react-toastify';

const AssignComplaint = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [selectedWorkers, setSelectedWorkers] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [c, w] = await Promise.all([
        API.get('/complaints'),
        API.get('/workers'),
      ]);
      setComplaints(c.data.filter((c: any) => c.status === 'Pending' || c.status === 'Assigned'));
      setWorkers(w.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {complaints.map((complaint: any) => {
            const matchedWorkers = workers.filter(w =>
              w.skill?.toLowerCase().includes(complaint.category?.toLowerCase()) ||
              complaint.category?.toLowerCase().includes(w.skill?.toLowerCase())
            );
            const displayWorkers = matchedWorkers.length > 0 ? matchedWorkers : workers;

            return (
              <div key={complaint.id} style={{
                background: 'white', borderRadius: '12px', padding: '16px 20px',
                border: '1px solid #e5e7eb',
                borderLeft: `4px solid ${complaint.priority === 'High' || complaint.priority === 'Critical' ? '#dc2626' : complaint.priority === 'Medium' ? '#d97706' : '#10b981'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>{complaint.complaint_id}</span>
                      <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', fontWeight: '500', ...getPriorityStyle(complaint.priority) }}>
                        {complaint.priority}
                      </span>
                      <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', fontWeight: '500' }}>
                        {complaint.status}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>{complaint.title}</h3>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>Category: {complaint.category || complaint.ai_category || '—'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                      Select Worker {matchedWorkers.length > 0 && <span style={{ color: '#16a34a', fontSize: '11px' }}>— AI matched {matchedWorkers.length} worker(s) by skill</span>}
                    </label>
                    <select
                      value={selectedWorkers[complaint.id] || ''}
                      onChange={e => setSelectedWorkers(prev => ({ ...prev, [complaint.id]: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                    >
                      <option value="">Select worker</option>
                      {displayWorkers.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name} — {w.skill || 'General'} | Rating: {w.avg_rating || '0'} | Active tasks: {w.pending_count || 0}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleAssign(complaint.id)}
                    disabled={assigning === complaint.id}
                    style={{
                      padding: '8px 20px', marginTop: '20px',
                      background: assigning === complaint.id ? '#93c5fd' : '#2563eb',
                      color: 'white', border: 'none', borderRadius: '8px',
                      fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {assigning === complaint.id ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssignComplaint;