import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../utils/api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const PAGE_SIZE = 10;

const Masters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState(searchParams.get('tab') || 'blocks');
  const [blocks, setBlocks] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formValue, setFormValue] = useState('');
  const [formExtra, setFormExtra] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && urlTab !== activeTab) {
      setActiveTabState(urlTab);
    }
  }, [searchParams]);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
    setPage(1);
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [bl, f, d, c, r] = await Promise.all([
        API.get('/master/blocks'),
        API.get('/master/floors'),
        API.get('/master/departments'),
        API.get('/master/categories'),
        API.get('/master/designations'),
      ]);
      setBlocks(bl.data);
      setFloors(f.data);
      setDepartments(d.data);
      setCategories(c.data);
      setDesignations(r.data);
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormValue('');
    setFormExtra('');
    setEditingId(null);
    setShowForm(false);
  };

  const startAdd = () => {
    setEditingId(null);
    setFormValue('');
    setFormExtra('');
    setShowForm(true);
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setFormValue(item[currentTab!.nameKey]);
    if (activeTab === 'floors') setFormExtra(String(item.block_id));
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formValue.trim()) { toast.error('Please enter a value'); return; }
    try {
      if (editingId) {
        if (activeTab === 'blocks') await API.put(`/master/blocks/${editingId}`, { block_name: formValue });
        if (activeTab === 'floors') await API.put(`/master/floors/${editingId}`, { floor_name: formValue, block_id: formExtra });
        if (activeTab === 'departments') await API.put(`/master/departments/${editingId}`, { department_name: formValue });
        if (activeTab === 'categories') await API.put(`/master/categories/${editingId}`, { category_name: formValue });
        if (activeTab === 'roles') await API.put(`/master/designations/${editingId}`, { designation_name: formValue });
        toast.success('Updated successfully!');
      } else {
        if (activeTab === 'blocks') await API.post('/master/blocks', { block_name: formValue });
        if (activeTab === 'floors') await API.post('/master/floors', { floor_name: formValue, block_id: formExtra });
        if (activeTab === 'departments') await API.post('/master/departments', { department_name: formValue });
        if (activeTab === 'categories') await API.post('/master/categories', { category_name: formValue });
        if (activeTab === 'roles') await API.post('/master/designations', { designation_name: formValue });
        toast.success('Added successfully!');
      }
      resetForm();
      fetchAll();
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
      if (activeTab === 'blocks') await API.delete(`/master/blocks/${id}`);
      if (activeTab === 'floors') await API.delete(`/master/floors/${id}`);
      if (activeTab === 'departments') await API.delete(`/master/departments/${id}`);
      if (activeTab === 'categories') await API.delete(`/master/categories/${id}`);
      if (activeTab === 'roles') await API.delete(`/master/designations/${id}`);
      Swal.fire('Deleted!', 'Item has been deleted.', 'success');
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    }
  };

  const tabs = [
    { key: 'blocks', label: 'Blocks', data: blocks, nameKey: 'block_name' },
    { key: 'floors', label: 'Floors', data: floors, nameKey: 'floor_name' },
    { key: 'departments', label: 'Departments', data: departments, nameKey: 'department_name' },
    { key: 'categories', label: 'Categories', data: categories, nameKey: 'category_name' },
    { key: 'roles', label: 'User Roles', data: designations, nameKey: 'designation_name' },
  ];

  const currentTab = tabs.find(t => t.key === activeTab);
  const totalPages = Math.max(1, Math.ceil((currentTab?.data.length || 0) / PAGE_SIZE));
  const paginatedData = currentTab?.data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) || [];

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Masters Management</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Manage blocks, floors, departments, categories and designations
          </p>
        </div>
        <button
          onClick={startAdd}
          style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
        >
          Add New
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); resetForm(); }}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              background: activeTab === tab.key ? '#2563eb' : '#f3f4f6',
              color: activeTab === tab.key ? 'white' : '#4b5563',
            }}
          >
            {tab.label} ({tab.data.length})
          </button>
        ))}
      </div>

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
              width: '480px', maxWidth: '100%'
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              {editingId ? 'Edit' : 'Add'} {currentTab?.label.slice(0, -1)}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeTab === 'floors' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Block</label>
                  <select value={formExtra} onChange={e => setFormExtra(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                    <option value="">Select block</option>
                    {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Name</label>
                <input
                  value={formValue}
                  onChange={e => setFormValue(e.target.value)}
                  placeholder={`Enter ${currentTab?.label.slice(0, -1).toLowerCase()} name`}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleSave}
                style={{ padding: '9px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                {editingId ? 'Update' : 'Add'}
              </button>
              <button onClick={resetForm}
                style={{ padding: '9px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>ID</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Name</th>
              {activeTab === 'floors' && <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Block</th>}
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item: any) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{item.id}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500', color: '#111827' }}>
                  {item[currentTab!.nameKey]}
                </td>
                {activeTab === 'floors' && <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{item.block_name}</td>}
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => startEdit(item)}
                      style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {currentTab?.data.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                  No {currentTab?.label.toLowerCase()} found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {currentTab && currentTab.data.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, currentTab.data.length)} of {currentTab.data.length}
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

export default Masters;