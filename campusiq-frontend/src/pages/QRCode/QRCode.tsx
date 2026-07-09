import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import API from '../../utils/api';

const QRCode = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [printed, setPrinted] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const [buildings, blocks, floors] = await Promise.all([
          API.get('/master/buildings'),
          API.get('/master/blocks'),
          API.get('/master/floors'),
        ]);

        // Combine to create room list
        const roomList: any[] = [];
        floors.data.forEach((floor: any) => {
          const block = blocks.data.find((b: any) => b.id === floor.block_id);
          const building = block ? buildings.data.find((b: any) => b.id === block.building_id) : null;
          if (block && building) {
            roomList.push({
              id: floor.id,
              name: `${floor.floor_name} — ${block.block_name}`,
              building: building.building_name,
              floor: floor.floor_name,
              block: block.block_name,
              building_id: building.id,
              block_id: block.id,
              floor_id: floor.id,
            });
          }
        });
        setRooms(roomList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

const getQRValue = (room: any) => {
    // Same auto-detect approach as api.ts — uses whatever address the Admin's
    // browser is currently on, instead of a hardcoded IP that goes stale
    // every time the WiFi network reassigns one.
    return `http://${window.location.hostname}:5173/qr-raise?room=${encodeURIComponent(room.name)}&building=${encodeURIComponent(room.building)}&floor=${encodeURIComponent(room.floor)}&block=${encodeURIComponent(room.block)}&building_id=${room.building_id}&block_id=${room.block_id}&floor_id=${room.floor_id}`;
  };

  const handlePrint = (room: any) => {
    setSelected(room);
    if (!printed.includes(room.id)) {
      setPrinted(prev => [...prev, room.id]);
    }
    setTimeout(() => window.print(), 500);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <p style={{ color: '#6b7280' }}>Loading rooms from database...</p>
    </div>
  );

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; }
        }
      `}</style>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>QR Code Complaint System</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          Auto-generated QR codes from database — scan to raise complaints instantly
        </p>
      </div>

      {/* How it works */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        borderRadius: '12px', padding: '20px', marginBottom: '24px', color: 'white'
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>How It Works</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {[
            { step: '1', text: 'QR codes auto-generated from your buildings database' },
            { step: '2', text: 'Print and place QR code in each room' },
            { step: '3', text: 'Student scans QR — complaint form opens with room pre-filled' },
            { step: '4', text: 'AI analyzes text and submits complaint instantly' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '180px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '14px', flexShrink: 0
              }}>{item.step}</div>
              <p style={{ fontSize: '12px', color: '#bfdbfe' }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Rooms', value: rooms.length, color: '#2563eb' },
          { label: 'QR Generated', value: rooms.length, color: '#16a34a' },
          { label: 'Printed', value: printed.length, color: '#8b5cf6' },
          { label: 'Remaining', value: rooms.length - printed.length, color: '#d97706' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, background: 'white', borderRadius: '12px',
            padding: '16px 20px', border: '1px solid #e5e7eb',
            borderLeft: `4px solid ${s.color}`
          }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* QR Grid */}
      {rooms.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#9ca3af', fontSize: '15px' }}>No rooms found. Add buildings, blocks and floors in Masters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {rooms.map(room => (
            <div key={room.id} style={{
              background: 'white', borderRadius: '12px', padding: '20px',
              border: `1px solid ${printed.includes(room.id) ? '#86efac' : '#e5e7eb'}`,
              textAlign: 'center'
            }}>
              <div style={{
                display: 'inline-block', padding: '12px',
                background: '#f9fafb', borderRadius: '10px', marginBottom: '12px'
              }}>
                <QRCodeSVG value={getQRValue(room)} size={120} level="H" includeMargin={true} />
              </div>

              <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '14px' }}>
                {room.name}
              </h3>

              {printed.includes(room.id) && (
                <span style={{
                  fontSize: '11px', padding: '3px 10px', borderRadius: '10px',
                  background: '#f0fdf4', color: '#16a34a', fontWeight: '500',
                  display: 'inline-block', marginBottom: '10px'
                }}>✓ Printed</span>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setSelected(room)}
                  style={{ flex: 1, padding: '8px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                  Preview
                </button>
                <button onClick={() => handlePrint(room)}
                  style={{ flex: 1, padding: '8px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                  Print
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {selected && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}
          onClick={() => setSelected(null)}
        >
          <div id="print-area"
            style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', maxWidth: '320px', width: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              width: '48px', height: '48px', background: '#2563eb',
              borderRadius: '12px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>CQ</span>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>CampusIQ</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Scan to report an issue</p>

            <div style={{ display: 'inline-block', padding: '16px', border: '2px solid #e5e7eb', borderRadius: '12px', marginBottom: '16px' }}>
              <QRCodeSVG value={getQRValue(selected)} size={180} level="H" includeMargin={true} />
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>{selected.name}</h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>
              Scan QR code with your phone camera to report a maintenance issue
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setSelected(null)}
                style={{ flex: 1, padding: '10px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                Close
              </button>
              <button onClick={() => handlePrint(selected)}
                style={{ flex: 1, padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Print QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCode;