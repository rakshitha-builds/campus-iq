import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

type MenuLeaf = { label: string; path: string };
type MenuItem = MenuLeaf & { children?: MenuLeaf[] };

// Menu structure per role, based on guide's roadmap (3 roles: super_admin, admin, user).
// M = top-level menu item, SM = sub-menu item (children array below).
const menuConfig: { [key: string]: MenuItem[] } = {
  super_admin: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Complaints', path: '/complaints' }, // all complaints shown here
    { label: 'Assets Management', path: '/assets' }, // all assets shown here
    { label: 'Booking', path: '/bookings' }, // all bookings shown here
    { label: 'Announcement', path: '/notices' }, // full CRUD
    { label: 'Employees', path: '/workers' }, // full CRUD + user profile
    {
      label: 'Masters', path: '/masters',
      children: [
        { label: 'Department', path: '/masters?tab=departments' },
        { label: 'Category', path: '/masters?tab=categories' },
        { label: 'Blocks', path: '/masters?tab=blocks' },
        { label: 'User Role / Designation', path: '/masters?tab=roles' },
      ]
    },
    { label: 'Feedback & Rating', path: '/feedback' },
  ],
  admin: [
    { label: 'Dashboard', path: '/dashboard' },
    {
      label: 'Complaints', path: '/complaints',
      children: [
        { label: 'Assign Complaint', path: '/complaints/assign' },
        { label: 'Track Complaint', path: '/complaints/track' },
      ]
    },
    {
      label: 'Assets Management', path: '/assets',
      children: [
        { label: 'Perform & Operation', path: '/assets' },
      ]
    },
    { label: 'Announcement', path: '/notices' },
    { label: 'Employees', path: '/workers' }, // renamed from "Workers"
    { label: 'AI Scanner (Complaint)', path: '/qrcode' }, // renamed from "QR Complaints" per guide
    { label: 'Feedback & Rating', path: '/feedback' },
    // NOTE: Guide said keep this — do not remove — but hasn't finalized what it should do yet.
    // TODO: confirm with guide whether this stays as a live feature or needs rework before final submission.
    { label: 'Network Fault Detector', path: '/network-fault' },
  ],
  user: [
    { label: 'Dashboard', path: '/dashboard' },
    {
      label: 'Complaint', path: '/complaints/raise',
      children: [
        { label: 'Raise Complaint', path: '/complaints/raise' },
        { label: 'Track', path: '/complaints/track' },
      ]
    },
    { label: 'Announcement', path: '/notices' }, // single menu item, replaces separate Notice Board / Notification
    { label: 'Booking', path: '/bookings' }, // types: Conference, Auditorium (handled inside Bookings page)
    { label: 'Feedback', path: '/feedback' },
  ],
};

const roleLabels: { [key: string]: string } = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'User',
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const role = user?.role || 'user';
  const menuItems = menuConfig[role] || menuConfig.user;

  const isChildActive = (item: MenuItem) =>
    !!item.children?.some(c => location.pathname + location.search === c.path);

  const handleParentClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      setOpenMenu(openMenu === item.label ? null : item.label);
    } else {
      navigate(item.path);
    }
  };

  return (
    <div style={{
      width: '240px', minHeight: '100vh',
      background: darkMode ? '#111827' : 'white',
      borderRight: `1px solid ${darkMode ? '#1f2937' : '#e5e7eb'}`,
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: `1px solid ${darkMode ? '#1f2937' : '#e5e7eb'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', background: '#2563eb',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '13px' }}>CQ</span>
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px', color: darkMode ? '#f9fafb' : '#111827' }}>CampusIQ</div>
            <div style={{ fontSize: '11px', color: darkMode ? '#9ca3af' : '#6b7280' }}>Smart Campus Platform</div>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: '12px 20px 0' }}>
        <span style={{
          fontSize: '11px', padding: '4px 10px', borderRadius: '20px',
          background: darkMode ? '#1e3a5f' : '#eff6ff', color: darkMode ? '#93c5fd' : '#2563eb', fontWeight: '600',
          display: 'inline-block'
        }}>
          {roleLabels[role]}
        </span>
      </div>

      {/* Menu */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {menuItems.map((item) => {
          const hasChildren = !!item.children?.length;
          const isDirectActive = location.pathname === item.path;
          const isOpen = openMenu === item.label || isChildActive(item);
          const isParentHighlighted = isDirectActive || isChildActive(item);

          return (
            <div key={item.label} style={{ marginBottom: '4px' }}>
              <button
                onClick={() => handleParentClick(item)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: '8px', border: 'none',
                  cursor: 'pointer', fontSize: '14px', fontWeight: isParentHighlighted ? '600' : '400',
                  textAlign: 'left',
                  background: isParentHighlighted ? (darkMode ? '#1e3a5f' : '#eff6ff') : 'transparent',
                  color: isParentHighlighted ? (darkMode ? '#93c5fd' : '#2563eb') : (darkMode ? '#d1d5db' : '#4b5563'),
                  transition: 'all 0.15s'
                }}
              >
                <span>{item.label}</span>
                {hasChildren && (
                  <span style={{ fontSize: '11px', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                    ▶
                  </span>
                )}
              </button>

              {hasChildren && isOpen && (
                <div style={{ marginLeft: '12px', marginTop: '2px', borderLeft: `2px solid ${darkMode ? '#1e3a5f' : '#eff6ff'}`, paddingLeft: '10px' }}>
                  {item.children!.map((child) => {
                    const isChildActiveNow = location.pathname + location.search === child.path;
                    return (
                      <button
                        key={child.path}
                        onClick={() => navigate(child.path)}
                        style={{
                          width: '100%', display: 'block', textAlign: 'left',
                          padding: '8px 10px', borderRadius: '6px', border: 'none',
                          cursor: 'pointer', fontSize: '13px',
                          fontWeight: isChildActiveNow ? '600' : '400',
                          marginBottom: '2px',
                          background: isChildActiveNow ? (darkMode ? '#1e3a5f' : '#eff6ff') : 'transparent',
                          color: isChildActiveNow ? (darkMode ? '#93c5fd' : '#2563eb') : (darkMode ? '#9ca3af' : '#6b7280'),
                        }}
                      >
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: `1px solid ${darkMode ? '#1f2937' : '#e5e7eb'}` }}>
        <p style={{ fontSize: '12px', color: darkMode ? '#6b7280' : '#9ca3af', textAlign: 'center' }}>CampusIQ © 2026</p>
      </div>
    </div>
  );
};

export default Sidebar;