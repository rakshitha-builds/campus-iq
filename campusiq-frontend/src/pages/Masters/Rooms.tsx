import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const PAGE_SIZE = 10;

const Rooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [roomName, setRoomName] = useState('');
  const [blockId, setBlockId] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, b] = await Promise.all([
        API.get('/rooms'),
        API.get('/master/blocks'),
      ]);
      setRooms(r.data);
      setBlocks(b.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRoomName('');
    setBlockId('');
    setEditingId(null);
    setShowForm(false);
  };

  const startAdd = () => {
    setRoomName('');
    setBlockId('');
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (room: any) => {
    setEditingId(room.id);
    setRoomName(room.room_name);
    setBlockId(room.block_id ? String(room.block_id) : '');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!roomName.trim()) { toast.error('Please enter a room name'); return; }
    try {
      if (editingId) {
        await API.put(`/rooms/${editingId}`, { room_name: roomName, block_id: blockId || null });
        toast.success('Room updated successfully!');
      } else {
        await API.post('/rooms', { room_name: roomName, block_id: blockId || null });
        toast.success('Room added successfully!');
      }
      resetForm();
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (editingId ? 'Failed to update room' : 'Failed to add room'));
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Delete this room?',
      text: 'This room will no longer be bookable.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/rooms/${id}`);
      toast.success('Room deleted');
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete room');
    }
  };

  const totalPages = Math.max(1, Math.ceil(rooms.length / PAGE_SIZE));
  const paginated = rooms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Rooms</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Manage bookable rooms — these appear automatically in the Booking page
          </p>
        </div>
        <button
          onClick={() => (showForm ? resetForm() : startAdd())}
          style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
        >
          {showForm ? 'Cancel' : 'Add Room'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
            {editingId ? 'Edit Room' : 'Add Room'}
          </h3>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
            If a room exists in more than one block (e.g. "Classroom" in both PG Block and UG Block), add it once per block.
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Room Name</label>
              <input
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                placeholder="e.g. Auditorium, Classroom"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Block</label>
              <select value={blockId} onChange={e => setBlockId(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                <option value="">Select block</option>
                {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
              </select>
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
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Room Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Block</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((room: any, index: number) => (
              <tr key={room.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{(page - 1) * PAGE_SIZE + index + 1}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500', color: '#111827' }}>{room.room_name}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{room.block_name || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => startEdit(room)}
                      style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(room.id)}
                      style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                  No rooms found. Add your first room.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rooms.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', marginBottom: '80px' }}>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rooms.length)} of {rooms.length}
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

export default Rooms;