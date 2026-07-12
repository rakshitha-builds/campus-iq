import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const rooms = [
  { id: 1, name: 'Auditorium', blocks: ['UG Block'], floor: 'Ground Floor' },
  { id: 2, name: 'Conference Hall', blocks: ['PG Block'], floor: '2nd Floor' },
  { id: 3, name: 'Classroom', blocks: ['PG Block', 'UG Block'], floor: '2nd Floor' },
  { id: 4, name: 'Board Meeting Room', blocks: ['PG Block'], floor: '2nd Floor' },
  { id: 5, name: 'Indoor Stadium', blocks: ['PG Block'], floor: 'Ground Floor' },
  { id: 6, name: 'Activity Room', blocks: ['PG Block'], floor: '2nd Floor' },
];

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const getTomorrowString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const Bookings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'rooms' | 'bookings' | 'new' | 'upcoming'>('rooms');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    room_name: '', block: '', booking_date: '', start_time: '', end_time: '', purpose: '', department: ''
  });

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await API.get('/bookings');
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!form.room_name || !form.block || !form.booking_date || !form.start_time || !form.end_time || !form.purpose) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.booking_date <= getTodayString()) {
      toast.error('Bookings must be made in advance — please select a future date.');
      return;
    }
    try {
      await API.post('/bookings', {
        room_name: form.room_name,
        block: form.block,
        booking_date: form.booking_date,
        start_time: form.start_time,
        end_time: form.end_time,
        purpose: form.purpose,
        department: form.department || user?.department || 'General',
      });
      Swal.fire({
        icon: 'success',
        title: 'Room Booked!',
        text: `${form.room_name} (${form.block}) booked for ${form.booking_date} from ${form.start_time} to ${form.end_time}.`,
        confirmButtonColor: '#2563eb',
      }).then(() => {
        setActiveTab('bookings');
        fetchBookings();
        setForm({ room_name: '', block: '', booking_date: '', start_time: '', end_time: '', purpose: '', department: '' });
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to book. Please try again.');
    }
  };

  const handleCancel = async (id: number) => {
    const result = await Swal.fire({
      title: 'Cancel Booking?',
      text: 'This will permanently cancel the booking.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, cancel it',
    });
    if (!result.isConfirmed) return;
    try {
      await API.delete(`/bookings/${id}`);
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err) {
      toast.error('Failed to cancel');
    }
  };

  const today = getTodayString();
  const todayBookings = bookings.filter(b => b.booking_date === today);
  const upcomingBookings = bookings.filter(b => b.booking_date > today);
  const pastBookings = bookings.filter(b => b.booking_date < today);

  const isRoomBookedToday = (roomName: string) =>
    todayBookings.some(b => b.room_name === roomName);

  const filteredRooms = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.blocks.some(b => b.toLowerCase().includes(search.toLowerCase()))
  );

  const BookingTable = ({ data, showCancel = false }: { data: any[], showCancel?: boolean }) => (
    data.length === 0 ? (
      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
        <p style={{ fontSize: '28px', marginBottom: '8px' }}>📅</p>
        <p>No bookings found</p>
      </div>
    ) : (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['Booking ID', 'Room', 'Block', 'Booked By', 'Department', 'Date', 'Time', 'Purpose', 'Status', ...(showCancel ? ['Action'] : [])].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((b: any) => (
            <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280' }}>{b.booking_id}</td>
              <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '600', color: '#111827' }}>{b.room_name}</td>
              <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280' }}>{b.block || '—'}</td>
              <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280' }}>{b.booked_by_name || b.user_name || '—'}</td>
              <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280' }}>{b.department || b.user_department || '—'}</td>
              <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280' }}>{b.booking_date}</td>
              <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280' }}>{b.start_time} - {b.end_time}</td>
              <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6b7280' }}>{b.purpose}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{
                  fontSize: '11px', padding: '3px 8px', borderRadius: '10px', fontWeight: '500',
                  background: b.status === 'Confirmed' ? '#f0fdf4' : '#fef3c7',
                  color: b.status === 'Confirmed' ? '#16a34a' : '#d97706'
                }}>{b.status}</span>
              </td>
              {showCancel && (
                <td style={{ padding: '10px 12px' }}>
                  <button onClick={() => handleCancel(b.id)}
                    style={{ fontSize: '11px', padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    )
  );

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Room & Resource Booking</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          Smart booking system — {rooms.length} rooms available
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Rooms', value: rooms.length, color: '#2563eb' },
          { label: 'Booked Today', value: todayBookings.length, color: '#d97706' },
          { label: 'Available Today', value: rooms.length - todayBookings.length, color: '#16a34a' },
          { label: 'Upcoming', value: upcomingBookings.length, color: '#8b5cf6' },
          { label: 'Total Bookings', value: todayBookings.length + upcomingBookings.length, color: '#6b7280' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, background: 'white', borderRadius: '12px',
            padding: '14px 16px', border: '1px solid #e5e7eb',
            borderLeft: `4px solid ${s.color}`
          }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'rooms', label: `Available Rooms (${rooms.length - todayBookings.length})` },
          { key: 'bookings', label: `Today's Bookings (${todayBookings.length})` },
          { key: 'upcoming', label: `Upcoming (${upcomingBookings.length})` },
          { key: 'new', label: '+ New Booking' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              background: activeTab === tab.key ? '#2563eb' : '#f3f4f6',
              color: activeTab === tab.key ? 'white' : '#4b5563',
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* Available Rooms */}
      {activeTab === 'rooms' && (
        <div>
          <input type="text" placeholder="Search rooms..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '300px', padding: '9px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', marginBottom: '16px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {filteredRooms.map(room => {
              const booked = isRoomBookedToday(room.name);
              const booking = todayBookings.find(b => b.room_name === room.name);
              const nextBooking = [...todayBookings, ...upcomingBookings]
                .filter(b => b.room_name === room.name)
                .sort((a, b) => (a.booking_date + a.start_time).localeCompare(b.booking_date + b.start_time))[0];
              return (
                <div key={room.id} style={{
                  background: 'white', borderRadius: '12px', padding: '16px',
                  border: `1px solid ${booked ? '#fca5a5' : '#e5e7eb'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{room.name}</h3>
                    {booked && (
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '500',
                        background: '#fef3c7', color: '#d97706'
                      }}>
                        Has booking(s) today
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '3px' }}>{room.blocks.join(' / ')}</p>
                  {booked && booking && (
                    <div style={{ background: '#fffbeb', borderRadius: '6px', padding: '6px 8px', marginBottom: '8px' }}>
                      <p style={{ fontSize: '11px', color: '#92400e' }}>
                        Booked by: {booking.booked_by_name} ({booking.department})
                      </p>
                      <p style={{ fontSize: '11px', color: '#92400e' }}>
                        {booking.start_time} - {booking.end_time} · {booking.purpose}
                      </p>
                      <p style={{ fontSize: '10px', color: '#b45309', marginTop: '3px' }}>
                        You can still book a different time slot today.
                      </p>
                    </div>
                  )}
                  {!booked && nextBooking && (
                    <div style={{ background: '#eff6ff', borderRadius: '6px', padding: '6px 8px', marginBottom: '8px' }}>
                      <p style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '500' }}>
                        Next booking: {nextBooking.booking_date} · {nextBooking.start_time}-{nextBooking.end_time}
                      </p>
                      <p style={{ fontSize: '11px', color: '#1d4ed8' }}>
                        {nextBooking.booked_by_name} — {nextBooking.purpose}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => { setActiveTab('new'); setForm({ ...form, room_name: room.name, block: room.blocks.length === 1 ? room.blocks[0] : '' }); }}
                    style={{
                      width: '100%', padding: '7px',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none', borderRadius: '7px',
                      cursor: 'pointer',
                      fontSize: '12px', fontWeight: '500'
                    }}
                  >
                    Book This Room
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's Bookings */}
      {activeTab === 'bookings' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            : <BookingTable data={todayBookings} showCancel={true} />}
        </div>
      )}

      {/* Upcoming Bookings */}
      {activeTab === 'upcoming' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
            : <BookingTable data={upcomingBookings} showCancel={true} />}
        </div>
      )}

      {/* New Booking Form */}
      {activeTab === 'new' && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb', maxWidth: '560px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '18px' }}>New Room Booking</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Select Room *</label>
              <select value={form.room_name} onChange={e => {
                const selected = rooms.find(r => r.name === e.target.value);
                setForm({ ...form, room_name: e.target.value, block: selected?.blocks.length === 1 ? selected.blocks[0] : '' });
              }}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                <option value="">Select a room</option>
                {rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Block *</label>
              <select
                value={form.block}
                onChange={e => setForm({ ...form, block: e.target.value })}
                disabled={!form.room_name}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none', background: !form.room_name ? '#f9fafb' : 'white' }}
              >
                <option value="">{form.room_name ? 'Select block' : 'Select a room first'}</option>
                {(rooms.find(r => r.name === form.room_name)?.blocks || []).map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Department</label>
              <input type="text" placeholder="e.g. MCA, Computer Science, Administration"
                value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Date *</label>
              <input type="date" value={form.booking_date} min={getTomorrowString()}
                onChange={e => setForm({ ...form, booking_date: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Bookings must be made in advance — same-day bookings are not allowed.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Start Time *</label>
                <input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>End Time *</label>
                <input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>Purpose *</label>
              <input type="text" placeholder="e.g. Guest Lecture, Exam, Meeting, Seminar"
                value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none' }} />
            </div>
            <button onClick={handleBooking}
              style={{ padding: '11px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Confirm Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;