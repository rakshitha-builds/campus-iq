import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getRiskColor = (score: number) => {
  if (score >= 80) return { bg: '#fee2e2', color: '#dc2626', label: 'Critical' };
  if (score >= 50) return { bg: '#fef3c7', color: '#d97706', label: 'Medium' };
  return { bg: '#f0fdf4', color: '#16a34a', label: 'Low' };
};

const emptyForm = {
  asset_name: '', category: '', location: '', purchase_date: '', warranty_expiry: '',
  status: 'Active', failure_count: 0, risk_score: 0
};

const Assets = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text('CampusIQ — Asset Inventory Report', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    doc.text(`Total Assets: ${assets.length}`, 14, 31);

    autoTable(doc, {
      startY: 38,
      head: [['Asset ID', 'Name', 'Category', 'Location', 'Failures', 'Risk Score', 'Status']],
      body: assets.map((a: any) => [
        a.asset_id,
        a.asset_name,
        a.category || '—',
        a.location || '—',
        a.failure_count ?? 0,
        `${a.risk_score ?? 0}%`,
        a.status,
      ]),
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 9 },
    });

    doc.save(`campusiq-asset-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);

  useEffect(() => { fetchAssets(); }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await API.get('/assets');
      setAssets(res.data);
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

  const startAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (asset: any) => {
    setEditingId(asset.id);
    setForm({
      asset_name: asset.asset_name || '',
      category: asset.category || '',
      location: asset.location || '',
      purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
      warranty_expiry: asset.warranty_expiry ? asset.warranty_expiry.split('T')[0] : '',
      status: asset.status || 'Active',
      failure_count: asset.failure_count || 0,
      risk_score: asset.risk_score || 0,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.asset_name.trim()) {
      toast.error('Asset name is required');
      return;
    }
    try {
      if (editingId) {
        await API.put(`/assets/${editingId}`, form);
        toast.success('Asset updated successfully!');
      } else {
        await API.post('/assets', form);
        toast.success('Asset added successfully!');
      }
      resetForm();
      fetchAssets();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (editingId ? 'Failed to update asset' : 'Failed to add asset'));
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This asset will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/assets/${id}`);
      Swal.fire('Deleted!', 'Asset has been deleted.', 'success');
      fetchAssets();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete asset');
    }
  };

  const filtered = assets.filter(a =>
    a.asset_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase())
  );

  const critical = assets.filter(a => a.risk_score >= 80).length;
  const medium = assets.filter(a => a.risk_score >= 50 && a.risk_score < 80).length;
  const healthy = assets.filter(a => a.risk_score < 50).length;
  const topRisks = [...assets].sort((a, b) => b.risk_score - a.risk_score).filter(a => a.risk_score >= 50).slice(0, 2);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <p style={{ color: '#6b7280' }}>Loading assets...</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Asset Management</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Track campus assets, warranty status, and failure history
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportPDF}
            disabled={assets.length === 0}
            style={{
              padding: '10px 20px', background: assets.length === 0 ? '#f3f4f6' : '#f0fdf4',
              color: assets.length === 0 ? '#9ca3af' : '#16a34a',
              border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500',
              cursor: assets.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Export PDF
          </button>
          <button
            onClick={() => (showForm ? resetForm() : startAdd())}
            style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
          >
            {showForm ? 'Cancel' : 'Add Asset'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Assets', value: assets.length, color: '#2563eb' },
          { label: 'Critical Risk', value: critical, color: '#dc2626' },
          { label: 'Medium Risk', value: medium, color: '#d97706' },
          { label: 'Healthy', value: healthy, color: '#16a34a' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, background: 'white', borderRadius: '12px',
            padding: '20px', border: '1px solid #e5e7eb',
            borderLeft: `4px solid ${s.color}`
          }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Risk Alert — only shows if there are actually flagged assets */}
      {topRisks.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
          borderRadius: '12px', padding: '20px', marginBottom: '24px', color: 'white'
        }}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px', fontSize: '15px' }}>
            Assets Needing Attention
          </h3>
          <p style={{ fontSize: '14px', color: '#fecaca', lineHeight: '1.6' }}>
            {topRisks.map((a, i) => (
              <span key={a.id}>
                <strong>{a.asset_name} ({a.asset_id})</strong> — {a.risk_score}% risk score, {a.failure_count} failure(s) recorded.
                {i < topRisks.length - 1 ? ' | ' : ''}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            {editingId ? 'Edit Asset' : 'Add New Asset'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Asset Name *</label>
              <input value={form.asset_name} onChange={e => setForm({ ...form, asset_name: e.target.value })} placeholder="e.g. Projector"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Category</label>
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics, HVAC, Network"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Location</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Room 101, Main Block"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Purchase Date</label>
              <input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Warranty Expiry</label>
              <input type="date" value={form.warranty_expiry} onChange={e => setForm({ ...form, warranty_expiry: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
            {editingId && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Failure Count</label>
                  <input type="number" min="0" value={form.failure_count} onChange={e => setForm({ ...form, failure_count: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Risk Score (0-100)</label>
                  <input type="number" min="0" max="100" value={form.risk_score} onChange={e => setForm({ ...form, risk_score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave}
              style={{ padding: '9px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              {editingId ? 'Update Asset' : 'Add Asset'}
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
        <input
          type="text"
          placeholder="Search assets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '10px 16px', border: '1px solid #e5e7eb',
            borderRadius: '8px', fontSize: '14px', width: '300px', outline: 'none'
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Asset ID', 'Name', 'Category', 'Location', 'Failures', 'Risk Score', 'Status', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((asset) => {
              const risk = getRiskColor(asset.risk_score);
              return (
                <tr key={asset.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>{asset.asset_id}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>{asset.asset_name}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{asset.category || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{asset.location || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#111827', fontWeight: '600' }}>{asset.failure_count}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '4px', height: '6px', maxWidth: '80px' }}>
                        <div style={{ width: `${asset.risk_score}%`, background: risk.color, height: '6px', borderRadius: '4px' }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: risk.color }}>{asset.risk_score}%</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: risk.bg, color: risk.color, fontWeight: '500' }}>
                        {risk.label}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: '12px', padding: '3px 10px', borderRadius: '20px',
                      background: asset.status === 'Active' ? '#f0fdf4' : asset.status === 'Retired' ? '#f3f4f6' : '#fef3c7',
                      color: asset.status === 'Active' ? '#16a34a' : asset.status === 'Retired' ? '#6b7280' : '#d97706',
                      fontWeight: '500'
                    }}>
                      {asset.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => startEdit(asset)}
                        style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                  No assets found. Add your first asset.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Assets;