import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

// Generic reusable CRUD list for simple single-field masters (Department,
// Category, Designation). No tabs — each page that uses this renders only
// its own section, driven by the props passed in, not by user tab-clicking.
type Props = {
  title: string;
  description: string;
  apiPath: string; // e.g. '/master/departments'
  nameKey: string; // e.g. 'department_name'
  singularLabel: string; // e.g. 'Department'
};

const SimpleMasterList = ({ title, description, apiPath, nameKey, singularLabel }: Props) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formValue, setFormValue] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get(apiPath);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormValue('');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setFormValue(item[nameKey]);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formValue.trim()) { toast.error('Please enter a value'); return; }
    try {
      if (editingId) {
        await API.put(`${apiPath}/${editingId}`, { [nameKey]: formValue });
        toast.success('Updated successfully!');
      } else {
        await API.post(apiPath, { [nameKey]: formValue });
        toast.success('Added successfully!');
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (editingId ? 'Failed to update' : 'Failed to add'));
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This item will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`${apiPath}/${id}`);
      Swal.fire('Deleted!', 'Item has been deleted.', 'success');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    }
  };

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{title}</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{description}</p>
        </div>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : `Add ${singularLabel}`}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
            {editingId ? 'Edit' : 'Add'} {singularLabel}
          </h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Name</label>
              <input
                value={formValue}
                onChange={e => setFormValue(e.target.value)}
                placeholder={`Enter ${singularLabel.toLowerCase()} name`}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <button onClick={handleSave}
              style={{ padding: '8px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {editingId ? 'Update' : 'Add'}
            </button>
            <button onClick={resetForm}
              style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>ID</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item: any) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{item.id}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500', color: '#111827' }}>{item[nameKey]}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => startEdit(item)}
                      style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)}
                      style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                  No {title.toLowerCase()} found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', marginBottom: '80px' }}>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.length)} of {data.length}
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

export default SimpleMasterList;