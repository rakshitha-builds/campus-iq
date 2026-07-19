import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { MapPin, ScanLine, Layers, DoorOpen } from 'lucide-react';
import API from '../../utils/api';

type Facility = {
  id: number;
  facility_name: string;
  facility_type: string;
};

type ScannedRoom = {
  room: string;
  block: string;
  floor: string;
  facilities: Facility[];
};

const SCANNER_ELEMENT_ID = 'qr-scanner-region';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScannedRoom | null>(null);
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      stopScanning();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    };
  }, []);

  const parseQRValue = async (decodedText: string): Promise<ScannedRoom | null> => {
    try {
      const url = new URL(decodedText);
      const params = url.searchParams;
      const room = params.get('room');
      const floorId = params.get('floor_id');
      if (!room) return null;

      // The QR's text labels are frozen at print time — do a live lookup
      // by the stable floor_id so a renamed block still shows correctly,
      // without needing to reprint old QR codes.
      if (floorId) {
        try {
          const res = await API.get(`/master/floors/${floorId}/info-public`);
          return {
            room,
            block: res.data.block_name || 'Unknown',
            floor: res.data.floor_name || 'Unknown',
            facilities: res.data.facilities || [],
          };
        } catch {
          // Floor may have been deleted — fall back to the QR's printed labels
        }
      }

      return {
        room,
        block: params.get('block') || 'Unknown',
        floor: params.get('floor') || 'Unknown',
        facilities: [],
      };
    } catch {
      return null;
    }
  };

  const startScanning = async () => {
    setError('');
    setResult(null);
    setScanning(true);

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            const parsed = await parseQRValue(decodedText);
            if (parsed) {
              setResult(parsed);
              stopScanning();
            } else {
              setError(`That QR code isn't a CampusIQ room code. Scanned content: "${decodedText}"`);
            }
          },
          () => { /* ignore per-frame "no QR found" noise */ }
        );
      } catch (err: any) {
        setError('Could not access camera — please allow camera permission and try again.');
        setScanning(false);
      }
    }, 150);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const scanAgain = () => {
    setResult(null);
    setError('');
  };

  // Decode a QR code from an uploaded image file — avoids all the
  // glare/brightness/distance issues of scanning a screen with a live
  // camera, since the library reads the image data directly.
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setResult(null);

    try {
      const tempScanner = new Html5Qrcode('qr-file-scan-region');
      const decodedText = await tempScanner.scanFile(file, false);
      const parsed = await parseQRValue(decodedText);
      if (parsed) {
        setResult(parsed);
      } else {
        setError(`That QR code isn't a CampusIQ room code. Scanned content: "${decodedText}"`);
      }
      tempScanner.clear();
    } catch (err: any) {
      console.error('QR file scan error:', err);
      setError(`Could not read a QR code from that image. (${err?.message || err || 'unknown error'})`);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>QR Room Scanner</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          Scan any printed room QR code to view its location details instantly
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb', maxWidth: '480px' }}>
        {/* Hidden element required by html5-qrcode for file-based scanning —
            positioned off-screen instead of display:none, since some
            browsers give display:none elements zero dimensions, which
            breaks the library's internal canvas processing. */}
        <div id="qr-file-scan-region" style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '300px', height: '300px' }} />

        {!scanning && !result && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '18px', background: '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <ScanLine size={32} color="#2563eb" />
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
              Point your camera at any room's QR code (printed from the QR Code page) to instantly see which room, block, floor, and building it belongs to.
            </p>
            <button
              onClick={startScanning}
              style={{ padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px' }}
            >
              Start Scanning
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>

            <label style={{
              display: 'block', padding: '10px 24px', background: '#f3f4f6', color: '#374151',
              border: '1px dashed #d1d5db', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
              cursor: 'pointer', textAlign: 'center'
            }}>
              Upload a QR image instead
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
              Screenshot the QR code, or take a clear photo of a printed one, then upload it here
            </p>
          </div>
        )}

        {scanning && (
          <div>
            <div id={SCANNER_ELEMENT_ID} style={{ width: '100%', borderRadius: '10px', overflow: 'hidden' }} />
            <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '12px' }}>
              Point the camera at a QR code...
            </p>
            <button
              onClick={stopScanning}
              style={{ width: '100%', marginTop: '12px', padding: '9px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        )}

        {result && (
          <div>
            <div style={{
              background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px',
              padding: '20px', marginBottom: '16px', textAlign: 'center'
            }}>
              <DoorOpen size={28} color="#16a34a" style={{ marginBottom: '8px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>{result.room}</h3>
              <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>Room location found</p>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                <MapPin size={16} color="#6b7280" />
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>Block</p>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{result.block}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                <Layers size={16} color="#6b7280" />
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>Floor</p>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{result.floor}</p>
                </div>
              </div>
            </div>

            {result.facilities.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  What's on this floor
                </p>
                <div style={{ display: 'grid', gap: '6px' }}>
                  {result.facilities.map(f => (
                    <div key={f.id} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: '#f9fafb', borderRadius: '8px', padding: '8px 10px'
                    }}>
                      <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', fontWeight: '600' }}>
                        {f.facility_type}
                      </span>
                      <span style={{ fontSize: '13px', color: '#111827' }}>{f.facility_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={scanAgain}
              style={{ width: '100%', marginTop: '16px', padding: '10px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              Scan Another
            </button>
          </div>
        )}

        {error && (
          <p style={{ fontSize: '13px', color: '#dc2626', textAlign: 'center', marginTop: '14px' }}>{error}</p>
        )}
      </div>
    </div>
  );
};

export default QRScanner;