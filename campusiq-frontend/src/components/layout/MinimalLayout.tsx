import { Outlet } from 'react-router-dom';

// Used only for QR-code-initiated pages. Deliberately has no Sidebar, Navbar,
// or Chatbot — the person scanned a QR code to do one specific thing
// (raise a complaint), so we keep the screen focused on just that.
const MinimalLayout = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{
            width: '32px', height: '32px', background: '#2563eb',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '12px' }}>CQ</span>
          </div>
          <span style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>CampusIQ</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default MinimalLayout;