import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const typeColors: any = {
  Maintenance: { bg: '#fef3c7', color: '#d97706', border: '#f59e0b' },
  Academic: { bg: '#eff6ff', color: '#2563eb', border: '#3b82f6' },
  Alert: { bg: '#fee2e2', color: '#dc2626', border: '#ef4444' },
  General: { bg: '#f0fdf4', color: '#16a34a', border: '#22c55e' },
  Event: { bg: '#f5f3ff', color: '#7c3aed', border: '#8b5cf6' },
};

const Notices = () => {
  const { user } = useAuth();
  const isPrivileged = user?.role === 'super_admin' || user?.role === 'admin';
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({
    title: '', content: '', target_role: 'All',
    target_department: 'All', type: 'General'
  });

  useEffect(() => { fetchNotices(); }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await API.get('/notices');
      setNotices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!form.title || !form.content) {
      toast.error('Please fill title and content');
      return;
    }
    try {
      await API.post('/notices', {
        ...form,
        posted_by: user?.id || 2,
      });
      toast.success('Notice posted successfully!');
      setShowForm(false);
      setForm({ title: '', content: '', target_role: 'All', target_department: 'All', type: 'General' });
      fetchNotices();
    } catch (err) {
      toast.error('Failed to post notice');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Delete Notice?',
      text: 'This notice will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/notices/${id}`);
      toast.success('Notice deleted');
      fetchNotices();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filteredNotices = filter === 'All'
    ? notices
    : notices.filter(n => n.target_role === filter || n.target_department === filter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Campus Notice Board</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Targeted announcements for departments and roles
          </p>
        </div>
        {isPrivileged && (
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
            {showForm ? 'Cancel' : 'Post Notice'}
          </button>
        )}
      </div>

      {/* Post Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>Post New Notice</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Title *</label>
              <input type="text" placeholder="Notice title" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Content *</label>
              <textarea placeholder="Notice content..." value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Alert">Alert</option>
                  <option value="Event">Event</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Target Role</label>
                <select value={form.target_role} onChange={e => setForm({ ...form, target_role: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                  <option value="All">All</option>
                  <option value="user">Users Only</option>
                  <option value="admin">Admin Only</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Department</label>
                <input type="text" placeholder="e.g. MCA, All" value={form.target_department}
                  onChange={e => setForm({ ...form, target_department: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
              </div>
            </div>
            <button onClick={handlePost}
              style={{ padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Post Notice
            </button>
          </div>
        </div>
      )}

      {/* Filter — only relevant for staff managing notices; a User only sees what applies to them anyway */}
      {isPrivileged && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['All', 'user', 'admin'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none',
                cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                background: filter === f ? '#2563eb' : '#f3f4f6',
                color: filter === f ? 'white' : '#4b5563',
              }}>
              {f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Notices List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading notices...</div>
      ) : filteredNotices.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '32px', marginBottom: '8px' }}>📢</p>
          <p style={{ color: '#9ca3af' }}>No notices yet. Post the first notice.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {filteredNotices.map((notice: any) => {
            const colors = typeColors[notice.type] || typeColors.General;
            return (
              <div key={notice.id} style={{
                background: 'white', borderRadius: '12px', padding: '20px',
                border: '1px solid #e5e7eb'
              }}>
                {/* Title */}
                <div style={{ marginBottom: '14px' }}>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>
                    {notice.title}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>
                    Posted by {notice.posted_by_name || 'Admin'}
                  </p>
                </div>

                {/* Type + Target tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: colors.bg, color: colors.color, fontWeight: '500' }}>
                    {notice.type || 'General'}
                  </span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', fontWeight: '500' }}>
                    {notice.target_role === 'All' ? 'Everyone' : notice.target_role}
                  </span>
                  {notice.target_department && notice.target_department !== 'All' && (
                    <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', fontWeight: '500' }}>
                      {notice.target_department}
                    </span>
                  )}
                </div>

                {/* Content */}
                <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.6', marginBottom: '14px', minHeight: '40px' }}>
                  {notice.content}
                </p>

                {/* Date */}
                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '14px' }}>
                  {new Date(notice.created_at).toLocaleDateString()}
                </p>

                {/* Action */}
                {isPrivileged && (
                  <button onClick={() => handleDelete(notice.id)}
                    style={{ width: '100%', padding: '7px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notices;