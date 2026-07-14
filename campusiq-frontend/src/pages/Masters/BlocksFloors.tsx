import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const PAGE_SIZE = 10;

const BlocksFloors = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Which section's Add/Edit form is open
  const [activeSection, setActiveSection] = useState<'blocks' | 'floors' | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formValue, setFormValue] = useState('');
  const [formBlockId, setFormBlockId] = useState('');

  const [blockPage, setBlockPage] = useState(1);
  const [floorPage, setFloorPage] = useState(1);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [bl, fl] = await Promise.all([
        API.get('/master/blocks'),
        API.get('/master/floors'),
      ]);
      setBlocks(bl.data);
      setFloors(fl.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormValue('');
    setFormBlockId('');
    setEditingId(null);
    setActiveSection(null);
  };

  const startAdd = (section: 'blocks' | 'floors') => {
    setEditingId(null);
    setFormValue('');
    setFormBlockId('');
    setActiveSection(section);
  };

  const startEdit = (section: 'blocks' | 'floors', item: any) => {
    setEditingId(item.id);
    setFormValue(section === 'blocks' ? item.block_name : item.floor_name);
    if (section === 'floors') setFormBlockId(String(item.block_id));
    setActiveSection(section);
  };

  const handleSave = async () => {
    if (!formValue.trim()) { toast.error('Please enter a value'); return; }
    if (activeSection === 'floors' && !formBlockId) { toast.error('Please select a block'); return; }
    try {
      if (activeSection === 'blocks') {
        if (editingId) await API.put(`/master/blocks/${editingId}`, { block_name: formValue });
        else await API.post('/master/blocks', { block_name: formValue });
      } else {
        if (editingId) await API.put(`/master/floors/${editingId}`, { floor_name: formValue, block_id: formBlockId });
        else await API.post('/master/floors', { floor_name: formValue, block_id: formBlockId });
      }
      toast.success(editingId ? 'Updated successfully!' : 'Added successfully!');
      resetForm();
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (editingId ? 'Failed to update' : 'Failed to add'));
    }
  };

  const handleDelete = async (section: 'blocks' | 'floors', id: number) => {
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
      await API.delete(`/master/${section}/${id}`);
      Swal.fire('Deleted!', 'Item has been deleted.', 'success');
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    }
  };

  const blockTotalPages = Math.max(1, Math.ceil(blocks.length / PAGE_SIZE));
  const paginatedBlocks = blocks.slice((blockPage - 1) * PAGE_SIZE, blockPage * PAGE_SIZE);
  const floorTotalPages = Math.max(1, Math.ceil(floors.length / PAGE_SIZE));
  const paginatedFloors = floors.slice((floorPage - 1) * PAGE_SIZE, floorPage * PAGE_SIZE);

  const PaginationBar = ({ page, setPage, totalPages, total }: { page: number; setPage: (fn: (p: number) => number) => void; totalPages: number; total: number }) => (
    total > 0 ? (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>
          Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
        </p>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: page === 1 ? '#d1d5db' : '#374151', fontSize: '12px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(() => p)}
              style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: page === p ? '#2563eb' : '#f3f4f6', color: page === p ? 'white' : '#4b5563', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: page === totalPages ? '#d1d5db' : '#374151', fontSize: '12px', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
            Next
          </button>
        </div>
      </div>
    ) : null
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <p style={{ color: '#6b7280' }}>Loading...</p>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Blocks & Floors</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          Manage campus blocks and their floors, used across complaints and asset assignment
        </p>
      </div>

      {/* BLOCKS SECTION */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>Blocks ({blocks.length})</h3>
          <button onClick={() => (activeSection === 'blocks' ? resetForm() : startAdd('blocks'))}
            style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            {activeSection === 'blocks' ? 'Cancel' : 'Add Block'}
          </button>
        </div>

        {activeSection === 'blocks' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Block Name</label>
                <input value={formValue} onChange={e => setFormValue(e.target.value)} placeholder="e.g. PG Block"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
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
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>ID</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBlocks.map((b: any) => (
                <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontSize: '13px', color: '#6b7280' }}>{b.id}</td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '500', color: '#111827' }}>{b.block_name}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => startEdit('blocks', b)}
                        style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete('blocks', b.id)}
                        style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {blocks.length === 0 && (
                <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No blocks found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar page={blockPage} setPage={setBlockPage} totalPages={blockTotalPages} total={blocks.length} />
      </div>

      {/* FLOORS SECTION */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>Floors ({floors.length})</h3>
          <button onClick={() => (activeSection === 'floors' ? resetForm() : startAdd('floors'))}
            style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
            {activeSection === 'floors' ? 'Cancel' : 'Add Floor'}
          </button>
        </div>

        {activeSection === 'floors' && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Block</label>
                <select value={formBlockId} onChange={e => setFormBlockId(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                  <option value="">Select block</option>
                  {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Floor Name</label>
                <input value={formValue} onChange={e => setFormValue(e.target.value)} placeholder="e.g. 2nd Floor"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
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
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>ID</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Block</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFloors.map((f: any) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 16px', fontSize: '13px', color: '#6b7280' }}>{f.id}</td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '500', color: '#111827' }}>{f.floor_name}</td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', color: '#6b7280' }}>{f.block_name}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => startEdit('floors', f)}
                        style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete('floors', f.id)}
                        style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {floors.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>No floors found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar page={floorPage} setPage={setFloorPage} totalPages={floorTotalPages} total={floors.length} />
      </div>
      <div style={{ marginBottom: '60px' }} />
    </div>
  );
};

export default BlocksFloors;