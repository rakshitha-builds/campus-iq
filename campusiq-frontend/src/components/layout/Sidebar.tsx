import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BarChart3, Bell, Bot, Boxes, Building2, CalendarClock, ChevronRight, ClipboardList, HardHat, Home, MessageSquareText, Settings2, Star, Users } from 'lucide-react';

type MenuLeaf = { label: string; path: string; icon?: React.ReactNode };
type MenuItem = MenuLeaf & { children?: MenuLeaf[] };

const menuConfig: { [key: string]: MenuItem[] } = {
  super_admin: [
    { label: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { label: 'Complaints', path: '/complaints', icon: <ClipboardList size={18} /> },
    { label: 'Assets', path: '/assets/items', icon: <Boxes size={18} />, children: [
      { label: 'Item', path: '/assets/items' },
      { label: 'Distributed', path: '/assets/distributed' },
    ]},
    { label: 'Booking', path: '/bookings', icon: <CalendarClock size={18} /> },
    { label: 'Announcement', path: '/notices', icon: <Bell size={18} /> },
    { label: 'Employees', path: '/workers', icon: <Users size={18} /> },
    { label: 'Masters', path: '/masters/department', icon: <Settings2 size={18} />, children: [
      { label: 'Department', path: '/masters/department' },
      { label: 'Designation', path: '/masters/category' },
      { label: 'Blocks', path: '/masters/blocks' },
      { label: 'Roles', path: '/masters/designation' },
      { label: 'Rooms', path: '/masters/rooms' },
    ]},
    { label: 'Feedback', path: '/feedback', icon: <Star size={18} /> },
  ],
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { label: 'Complaints', path: '/complaints', icon: <ClipboardList size={18} />, children: [
      { label: 'Complaint List', path: '/complaints' },
      { label: 'Assign Complaint', path: '/complaints/assign' },
      { label: 'Track Complaint', path: '/complaints/track' },
    ]},
    { label: 'Assets', path: '/assets/items', icon: <Boxes size={18} />, children: [
      { label: 'Item', path: '/assets/items' },
      { label: 'Distributed', path: '/assets/distributed' },
    ]},
    { label: 'Announcement', path: '/notices', icon: <Bell size={18} /> },
    { label: 'Employees', path: '/workers', icon: <HardHat size={18} /> },
    { label: 'Feedback', path: '/feedback', icon: <Star size={18} /> },
    { label: 'Network Fault', path: '/network-fault', icon: <Bot size={18} /> },
  ],
  user: [
    { label: 'Dashboard', path: '/dashboard', icon: <Home size={18} /> },
    { label: 'Complaint', path: '/complaints/raise', icon: <MessageSquareText size={18} />, children: [
      { label: 'Raise Complaint', path: '/complaints/raise' },
      { label: 'Track', path: '/complaints/track' },
    ]},
    { label: 'Announcement', path: '/notices', icon: <Bell size={18} /> },
    { label: 'Booking', path: '/bookings', icon: <CalendarClock size={18} /> },
    { label: 'Feedback', path: '/feedback', icon: <Star size={18} /> },
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
  const isChildActive = (item: MenuItem) => !!item.children?.some(c => location.pathname + location.search === c.path);

  useEffect(() => {
    const activeParent = menuItems.find(item => isChildActive(item));
    if (activeParent) setOpenMenu(activeParent.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const handleParentClick = (item: MenuItem) => {
    if (item.children?.length) {
      setOpenMenu(openMenu === item.label ? null : item.label);
    } else {
      setOpenMenu(null);
      navigate(item.path);
    }
  };

  return (
    <aside style={{
      width: '270px', minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: darkMode ? 'linear-gradient(180deg, #0f172a, #111827)' : 'linear-gradient(180deg, #ffffff 0%, #f8fffd 100%)',
      borderRight: `1px solid ${darkMode ? '#1f2937' : '#dbe7ee'}`,
      boxShadow: darkMode ? 'none' : '14px 0 35px rgba(15, 23, 42, 0.04)'
    }}>
      <div style={{ padding: '24px 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '15px',
            background: 'linear-gradient(135deg, #0f766e, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 16px 30px rgba(15, 118, 110, 0.20)'
          }}>
            <Building2 size={23} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '17px', color: darkMode ? '#f8fafc' : '#0f172a' }}>CampusIQ</div>
            <div style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>Smart Campus Suite</div>
          </div>
        </div>
      </div>

      <div style={{ margin: '0 16px 14px', padding: '14px', borderRadius: '16px', background: darkMode ? '#172033' : '#ecfdf5', border: `1px solid ${darkMode ? '#26344f' : '#bbf7d0'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: darkMode ? '#99f6e4' : '#047857', fontSize: '12px', fontWeight: 800 }}>
          <BarChart3 size={15} /> {roleLabels[role]}
        </div>
        <div style={{ marginTop: '7px', fontSize: '12px', color: darkMode ? '#cbd5e1' : '#475569', lineHeight: 1.45 }}>
          {user?.name || 'Campus User'} workspace
        </div>
      </div>

      <nav style={{ padding: '4px 12px 16px', flex: 1 }}>
        {menuItems.map((item) => {
          const hasChildren = !!item.children?.length;
          const active = location.pathname === item.path || isChildActive(item);
          const isOpen = openMenu === item.label;
          return (
            <div key={item.label} style={{ marginBottom: '6px' }}>
              <button onClick={() => handleParentClick(item)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '10px', padding: '11px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: active ? 'linear-gradient(135deg, #0f766e, #2563eb)' : 'transparent',
                color: active ? 'white' : (darkMode ? '#cbd5e1' : '#475569'),
                fontSize: '14px', fontWeight: active ? 800 : 650,
                boxShadow: active ? '0 14px 28px rgba(37, 99, 235, 0.20)' : 'none'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                  <span style={{ display: 'flex', color: active ? 'white' : '#0f766e' }}>{item.icon}</span>
                  {item.label}
                </span>
                {hasChildren && <ChevronRight size={16} style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease' }} />}
              </button>

              {hasChildren && isOpen && (
                <div style={{ margin: '8px 0 8px 22px', paddingLeft: '13px', borderLeft: `2px solid ${darkMode ? '#334155' : '#b7e4db'}` }}>
                  {item.children!.map(child => {
                    const childActive = location.pathname + location.search === child.path;
                    return (
                      <button key={child.path} onClick={() => navigate(child.path)} style={{
                        width: '100%', textAlign: 'left', border: 'none', borderRadius: '9px', padding: '8px 10px', marginBottom: '3px', cursor: 'pointer',
                        background: childActive ? (darkMode ? '#1e293b' : '#e6fffb') : 'transparent',
                        color: childActive ? '#0f766e' : (darkMode ? '#94a3b8' : '#64748b'),
                        fontSize: '13px', fontWeight: childActive ? 800 : 600
                      }}>
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

      <div style={{ padding: '16px' }}>
        <div style={{ padding: '14px', borderRadius: '16px', background: darkMode ? '#172033' : '#f1f5f9', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '12px', lineHeight: 1.45 }}>
          <strong style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>CampusIQ 2026</strong><br />AI-assisted campus operations
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;