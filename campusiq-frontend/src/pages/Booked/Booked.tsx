import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const emptyForm = { item_id: '', quantity: '', purchase_date: '', notes: '' };

const Booked = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [p, i] = await Promise.all([
        API.get('/purchases'),
        API.get('/items'),
      ]);
      setPurchases(p.data);
      setItems(i.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setReceipt(null);
    setShowForm(false);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReceipt(file);
  };

  const handleSave = async () => {
    if (!form.item_id || !form.quantity || !form.purchase_date) {
      toast.error('Item, quantity, and date are required');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('item_id', form.item_id);
      formData.append('quantity', form.quantity);
      formData.append('purchase_date', form.purchase_date);
      formData.append('notes', form.notes);
      if (receipt) formData.append('receipt', receipt);

      await API.post('/purchases', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Purchase recorded — stock updated!');
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save purchase');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Delete this purchase record?',
      text: "This will reduce the item's total stock accordingly.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/purchases/${id}`);
      toast.success('Record deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filtered = purchases.filter(p => p.item_name?.toLowerCase().includes(search.toLowerCase()));

  const getReceiptUrl = (record: any) =>
    record.receipt_url ? `${API.defaults.baseURL?.replace('/api', '')}${record.receipt_url}` : null;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <p style={{ color: '#6b7280' }}>Loading purchase records...</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Booked (New Stock)</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Log every new purchase — this is what increases each item's available stock
          </p>
        </div>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : 'Book New Stock'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Book New Purchase</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Item *</label>
              <select value={form.item_id} onChange={e => setForm({ ...form, item_id: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                <option value="">Select item</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.item_name} ({i.unit})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Quantity *</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Purchase Date *</label>
              <input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Notes</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Upload Receipt (optional)</label>
            <input type="file" accept="image/*,.pdf" onChange={handleReceiptChange} style={{ fontSize: '13px' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave}
              style={{ padding: '9px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              Save Purchase
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
        <input type="text" placeholder="Search by item..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', width: '300px', outline: 'none' }} />
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Item', 'Quantity', 'Date', 'Booked By', 'Receipt', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((record) => {
              const receiptUrl = getReceiptUrl(record);
              return (
                <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>{record.item_name}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>+{record.quantity} {record.unit}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{new Date(record.purchase_date).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{record.purchased_by_name || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {receiptUrl ? (
                      <a href={receiptUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#2563eb', fontWeight: '500' }}>
                        View
                      </a>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => handleDelete(record.id)}
                      style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                  No purchases recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Booked;