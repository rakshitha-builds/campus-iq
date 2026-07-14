import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const emptyForm = { item_id: '', department_id: '', quantity: '', distributed_date: '', notes: '' };
const PAGE_SIZE = 5;

const Distributed = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [d, i, dept] = await Promise.all([
        API.get('/distributions'),
        API.get('/items'),
        API.get('/master/departments'),
      ]);
      setRecords(d.data);
      setItems(i.data);
      setDepartments(dept.data);
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
    if (!form.item_id || !form.quantity || !form.distributed_date) {
      toast.error('Item, quantity, and date are required');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('item_id', form.item_id);
      formData.append('department_id', form.department_id);
      formData.append('quantity', form.quantity);
      formData.append('distributed_date', form.distributed_date);
      formData.append('notes', form.notes);
      if (receipt) formData.append('receipt', receipt);

      await API.post('/distributions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Distribution recorded successfully!');
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save record');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Delete this record?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/distributions/${id}`);
      toast.success('Record deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filtered = records.filter(r =>
    r.item_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.department_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const getReceiptUrl = (record: any) =>
    record.receipt_url ? `${API.defaults.baseURL?.replace('/api', '')}${record.receipt_url}` : null;

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text('CampusIQ — Distributed Assets Report', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    doc.text(`Total Records: ${records.length}`, 14, 31);

    autoTable(doc, {
      startY: 38,
      head: [['Item', 'Department', 'Quantity', 'Date', 'Distributed By']],
      body: records.map((r: any) => [
        r.item_name,
        r.department_name || '—',
        `${r.quantity} ${r.unit || ''}`,
        new Date(r.distributed_date).toLocaleDateString(),
        r.distributed_by_name || '—',
      ]),
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9 },
    });

    doc.save(`campusiq-distributed-assets-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <p style={{ color: '#6b7280' }}>Loading distribution records...</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Distributed Assets</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Track which department received which items, with receipts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportPDF}
            disabled={records.length === 0}
            style={{
              padding: '10px 20px', background: records.length === 0 ? '#f3f4f6' : '#f0fdf4',
              color: records.length === 0 ? '#9ca3af' : '#16a34a',
              border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500',
              cursor: records.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Export PDF
          </button>
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
          >
            {showForm ? 'Cancel' : 'Record Distribution'}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Record New Distribution</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Item *</label>
              <select value={form.item_id} onChange={e => setForm({ ...form, item_id: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                <option value="">Select item</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.item_name} ({i.remaining_stock} {i.unit} remaining)</option>)}
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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Quantity *</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Date *</label>
              <input type="date" value={form.distributed_date} onChange={e => setForm({ ...form, distributed_date: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Notes</label>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Upload Receipt (optional)</label>
            <input type="file" accept="image/*,.pdf" onChange={handleReceiptChange} style={{ fontSize: '13px' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave}
              style={{ padding: '9px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              Save Record
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
        <input type="text" placeholder="Search by item or department..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', width: '320px', outline: 'none' }} />
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Item', 'Department', 'Quantity', 'Date', 'Distributed By', 'Receipt', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((record) => {
              const receiptUrl = getReceiptUrl(record);
              return (
                <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>{record.item_name}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{record.department_name || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#111827', fontWeight: '600' }}>{record.quantity} {record.unit}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{new Date(record.distributed_date).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{record.distributed_by_name || '—'}</td>
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
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                  No distribution records yet.
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
    </div>
  );
};

export default Distributed;