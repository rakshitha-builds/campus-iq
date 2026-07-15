import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { toast } from 'react-toastify';
import { User } from 'lucide-react';

const Workers = () => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editWorker, setEditWorker] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', skill: '', department_id: '', status: 'Active'
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [w, d, r] = await Promise.all([
        API.get('/workers/stats'),
        API.get('/master/departments'),
        API.get('/master/categories'),
      ]);
      setWorkers(w.data);
      setDepartments(d.data);
      setDesignations(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', skill: '', department_id: '', status: 'Active' });
    setPhoto(null);
    setPhotoPreview('');
    setEditWorker(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.skill) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('skill', form.skill);
      formData.append('department_id', form.department_id);
      formData.append('status', form.status);
      if (photo) formData.append('photo', photo);

      if (editWorker) {
        await API.put(`/workers/${editWorker.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Employee updated successfully!');
      } else {
        await API.post('/workers', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Employee added successfully!');
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error('Failed to save employee');
    }
  };

  const handleEdit = (worker: any) => {
    setEditWorker(worker);
    setForm({
      name: worker.name,
      email: worker.email,
      phone: worker.phone || '',
      skill: worker.skill || '',
      department_id: worker.department_id || '',
      status: worker.status
    });
    setPhoto(null);
    setPhotoPreview(worker.photo_url ? `${API.defaults.baseURL?.replace('/api', '')}${worker.photo_url}` : '');
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await API.delete(`/workers/${id}`);
      toast.success('Employee deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filtered = workers.filter(w =>
    w.name?.toLowerCase().includes(search.toLowerCase()) ||
    w.skill?.toLowerCase().includes(search.toLowerCase())
  );

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#16a34a';
    if (rating >= 3) return '#d97706';
    return '#dc2626';
  };

  const getPhotoUrl = (worker: any) =>
    worker.photo_url ? `${API.defaults.baseURL?.replace('/api', '')}${worker.photo_url}` : null;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <p style={{ color: '#6b7280' }}>Loading employees...</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Employees Management</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Manage maintenance staff with AI performance tracking
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
        >
          Add Employee
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Employees', value: workers.length, color: '#2563eb' },
          { label: 'Active', value: workers.filter(w => w.status === 'Active').length, color: '#16a34a' },
          { label: 'Total Resolved', value: workers.reduce((a, w) => a + parseInt(w.total_resolved || 0), 0), color: '#8b5cf6' },
          { label: 'Avg Rating', value: workers.length ? (workers.reduce((a, w) => a + parseFloat(w.avg_rating || 0), 0) / workers.length).toFixed(1) : '0', color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: 'white', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', borderLeft: `4px solid ${s.color}` }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px'
          }}
          onClick={resetForm}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: '12px', padding: '24px',
              width: '640px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto'
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              {editWorker ? 'Edit Employee' : 'Add New Employee'}
            </h3>

            {/* Photo upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0,
                background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', border: '1px solid #e5e7eb'
              }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={28} color="#2563eb" />
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Profile Photo</label>
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ fontSize: '13px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Employee name"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Email *</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email address"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Designation *</label>
                <select value={form.skill} onChange={e => setForm({ ...form, skill: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                  <option value="">Select designation</option>
                  {designations.map(r => (
                    <option key={r.id} value={r.category_name}>{r.category_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Department</label>
                <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSubmit}
                style={{ padding: '9px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                {editWorker ? 'Update Employee' : 'Add Employee'}
              </button>
              <button onClick={resetForm}
                style={{ padding: '9px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <input type="text" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', width: '300px', outline: 'none' }} />
      </div>

      {/* Employees Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {filtered.map((worker: any) => {
          const photoUrl = getPhotoUrl(worker);
          return (
            <div key={worker.id} style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: '#eff6ff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '16px', fontWeight: '600', color: '#2563eb', flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {photoUrl ? (
                    <img src={photoUrl} alt={worker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={22} color="#2563eb" />
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{worker.name}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>{worker.email}</p>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', fontWeight: '500' }}>
                  {worker.skill || 'General'}
                </span>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: worker.status === 'Active' ? '#f0fdf4' : '#f9fafb', color: worker.status === 'Active' ? '#16a34a' : '#9ca3af', fontWeight: '500' }}>
                  {worker.status}
                </span>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                {[
                  { label: 'Rating', value: parseFloat(worker.avg_rating || 0).toFixed(1), color: getRatingColor(parseFloat(worker.avg_rating || 0)) },
                  { label: 'Resolved', value: worker.total_resolved || 0, color: '#2563eb' },
                  { label: 'Active', value: worker.active_tasks || 0, color: '#f59e0b' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#f9fafb', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                    <p style={{ fontSize: '16px', fontWeight: '700', color: s.color }}>{s.value}</p>
                    <p style={{ fontSize: '10px', color: '#9ca3af' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(worker)}
                  style={{ flex: 1, padding: '7px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(worker.id)}
                  style={{ flex: 1, padding: '7px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            No employees found. Add your first employee.
          </div>
        )}
      </div>
    </div>
  );
};

export default Workers;