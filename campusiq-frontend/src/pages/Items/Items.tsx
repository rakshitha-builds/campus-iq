import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const emptyForm = { item_name: '', unit: 'pcs' };

const Items = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await API.get('/items');
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.item_name.trim()) {
      toast.error('Item name is required');
      return;
    }
    try {
      if (editingId) {
        await API.put(`/items/${editingId}`, form);
        toast.success('Item updated successfully!');
      } else {
        await API.post('/items', form);
        toast.success('Item added successfully!');
      }
      resetForm();
      fetchItems();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save item');
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setForm({ item_name: item.item_name, unit: item.unit });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Delete this item?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/items/${id}`);
      toast.success('Item deleted');
      fetchItems();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete item');
    }
  };

  const filtered = items.filter(i => i.item_name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <p style={{ color: '#6b7280' }}>Loading items...</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Asset Items</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            The campus's stock catalog — projectors, keyboards, mice, monitors, and more
          </p>
        </div>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Item Types', value: items.length, color: '#2563eb' },
          { label: 'Total Booked (all time)', value: items.reduce((a, i) => a + parseInt(i.total_booked || 0), 0), color: '#16a34a' },
          { label: 'Total Distributed', value: items.reduce((a, i) => a + parseInt(i.total_distributed || 0), 0), color: '#d97706' },
          { label: 'Total Remaining', value: items.reduce((a, i) => a + parseInt(i.remaining_stock || 0), 0), color: '#7c3aed' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, background: 'white', borderRadius: '12px', padding: '18px',
            border: '1px solid #e5e7eb', borderLeft: `4px solid ${s.color}`
          }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '26px', fontWeight: '700', color: '#111827' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            {editingId ? 'Edit Item' : 'Add New Item'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Item Name *</label>
              <input value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} placeholder="e.g. Projector, Mouse, Keyboard"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Unit</label>
              <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="e.g. pcs, boxes"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
            Stock quantity isn't set here — go to <strong>Booked</strong> to log a purchase (adds stock) or <strong>Distributed</strong> to give items to a department (removes stock).
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave}
              style={{ padding: '9px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              {editingId ? 'Update Item' : 'Add Item'}
            </button>
            <button onClick={resetForm}
              style={{ padding: '9px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <input type="text" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', width: '300px', outline: 'none' }} />
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Item Name', 'Unit', 'Booked', 'Distributed', 'Remaining', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>{item.item_name}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{item.unit}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>{item.total_booked}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#d97706', fontWeight: '600' }}>{item.total_distributed}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: item.remaining_stock <= 0 ? '#dc2626' : '#7c3aed' }}>
                  {item.remaining_stock}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => startEdit(item)}
                      style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item.id)}
                      style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                  No items found. Add your first item.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Items;