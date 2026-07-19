import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const emptyForm = { item_name: '', unit: 'pcs', quantity: '', purchase_date: getTodayString(), notes: '' };
const PAGE_SIZE = 5;

const Items = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [invoice, setInvoice] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
    setInvoice(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.item_name.trim()) {
      toast.error('Item name is required');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('item_name', form.item_name);
      formData.append('unit', form.unit);
      if (form.quantity) formData.append('quantity', form.quantity);
      formData.append('purchase_date', form.purchase_date);
      if (form.notes) formData.append('notes', form.notes);
      if (invoice) formData.append('invoice', invoice);

      if (editingId) {
        await API.put(`/items/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(form.quantity ? 'Item updated and stock added!' : 'Item updated successfully!');
      } else {
        await API.post('/items', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
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
    setForm({ ...emptyForm, item_name: item.item_name, unit: item.unit, quantity: '', purchase_date: getTodayString() });
    setInvoice(null);
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
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleViewReceipts = async (item: any) => {
    setViewingItem(item);
    setHistoryLoading(true);
    try {
      const res = await API.get(`/items/${item.id}/purchases`);
      setPurchaseHistory(res.data);
    } catch (err) {
      toast.error('Failed to load purchase history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const getReceiptUrl = (receiptPath: string) =>
    `${API.defaults.baseURL?.replace('/api', '')}${receiptPath}`;

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text('CampusIQ — Asset Items Report', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    doc.text(`Total Item Types: ${items.length}`, 14, 31);

    autoTable(doc, {
      startY: 38,
      head: [['Item Name', 'Unit', 'Purchased', 'Distributed', 'Remaining']],
      body: items.map((i: any) => [
        i.item_name,
        i.unit,
        i.total_booked,
        i.total_distributed,
        i.remaining_stock,
      ]),
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9 },
    });

    doc.save(`campusiq-asset-items-${new Date().toISOString().split('T')[0]}.pdf`);
  };

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
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportPDF}
            disabled={items.length === 0}
            style={{
              padding: '10px 20px', background: items.length === 0 ? '#f3f4f6' : '#f0fdf4',
              color: items.length === 0 ? '#9ca3af' : '#16a34a',
              border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500',
              cursor: items.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Export PDF
          </button>
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
          >
            {showForm ? 'Cancel' : 'Add Item'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Item Types', value: items.length, color: '#2563eb' },
          { label: 'Total Purchased (all time)', value: items.reduce((a, i) => a + parseInt(i.total_booked || 0), 0), color: '#16a34a' },
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

      {/* Add/Edit Form Modal */}
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
              width: '560px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto'
            }}
          >
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            {editingId ? 'Edit Item' : 'Add New Item'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                {editingId ? 'Add More Stock (optional)' : 'Total Item (initial stock)'}
              </label>
              <input type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 20"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Date of Purchase</label>
              <input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Invoice / Receipt (optional)</label>
            <input type="file" accept="image/*,.pdf" onChange={e => setInvoice(e.target.files ? e.target.files[0] : null)}
              style={{ fontSize: '13px' }} />
          </div>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
            {editingId
              ? 'Leave "Add More Stock" blank if you only want to update the name/unit.'
              : 'Leave "Total Item" blank if you just want to add the item to the catalog without stock yet.'}
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
              {['Item Name', 'Unit', 'Purchased', 'Distributed', 'Remaining', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((item) => (
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
                    <button onClick={() => handleViewReceipts(item)}
                      style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: '#f0fdf4', color: '#16a34a', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                      View
                    </button>
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

      {/* Pagination */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', marginBottom: '80px' }}>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
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

      {/* Purchase History / Receipts Modal */}
      {viewingItem && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px'
          }}
          onClick={() => setViewingItem(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: '12px', padding: '24px',
              width: '560px', maxWidth: '100%', maxHeight: '80vh', overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>Purchase History</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{viewingItem.item_name}</p>
              </div>
              <button onClick={() => setViewingItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '20px', lineHeight: 1 }}>
                ×
              </button>
            </div>

            {historyLoading ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', padding: '30px 0' }}>Loading...</p>
            ) : purchaseHistory.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', padding: '30px 0' }}>No purchase records yet for this item.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {purchaseHistory.map((p: any) => (
                  <div key={p.id} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                        +{p.quantity} {viewingItem.unit} — {new Date(p.purchase_date).toLocaleDateString()}
                      </p>
                      <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        Purchased by {p.purchased_by_name || 'Unknown'}{p.notes ? ` · ${p.notes}` : ''}
                      </p>
                    </div>
                    {p.receipt_url ? (
                      <a href={getReceiptUrl(p.receipt_url)} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', fontWeight: '500', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        View Receipt
                      </a>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>No receipt</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;