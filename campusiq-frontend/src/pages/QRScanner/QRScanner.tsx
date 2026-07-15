import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { MapPin, ScanLine, Building2, Layers, DoorOpen } from 'lucide-react';

type ScannedRoom = {
  room: string;
  building: string;
  block: string;
  floor: string;
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

  const parseQRValue = (decodedText: string): ScannedRoom | null => {
    try {
      const url = new URL(decodedText);
      const params = url.searchParams;
      const room = params.get('room');
      if (!room) return null;
      return {
        room,
        building: params.get('building') || 'Unknown',
        block: params.get('block') || 'Unknown',
        floor: params.get('floor') || 'Unknown',
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
          (decodedText) => {
            const parsed = parseQRValue(decodedText);
            if (parsed) {
              setResult(parsed);
              stopScanning();
            } else {
              setError('That QR code isn\'t a CampusIQ room code.');
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
    startScanning();
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
              style={{ padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              Start Scanning
            </button>
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
                <Building2 size={16} color="#6b7280" />
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af' }}>Building</p>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{result.building}</p>
                </div>
              </div>
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