import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { User, Mail, Shield, Building2, Briefcase, Calendar, BadgeCheck, Phone, Pencil, Save, X } from 'lucide-react';

const roleLabels: { [key: string]: string } = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  user: 'User',
};

const Profile = () => {
  const { user, login, token } = useAuth() as any;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', department: '', phone: '', date_of_birth: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/auth/profile');
      setProfile(res.data);
      setForm({
        name: res.data.name || '',
        department: res.data.department || '',
        phone: res.data.phone || '',
        date_of_birth: res.data.date_of_birth ? res.data.date_of_birth.split('T')[0] : '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    setForm({
      name: profile?.name || '',
      department: profile?.department || '',
      phone: profile?.phone || '',
      date_of_birth: profile?.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const res = await API.put('/auth/profile', form);
      setProfile(res.data);
      // Keep the AuthContext / localStorage user object in sync so the
      // name shown elsewhere in the app (navbar avatar dropdown, etc.)
      // updates immediately without needing to log out and back in.
      if (login && token) {
        login(token, { ...user, ...res.data });
      }
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <p style={{ color: '#6b7280' }}>Loading profile...</p>
    </div>
  );

  const data = profile || user;
  const roleLabel = roleLabels[data?.role] || data?.role;
  const initial = data?.name?.charAt(0)?.toUpperCase() || '?';

  const bannerColors: { [key: string]: string } = {
    super_admin: 'linear-gradient(135deg, #312e81 0%, #6d28d9 100%)',
    admin: 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
    user: 'linear-gradient(135deg, #0f766e 0%, #059669 100%)',
  };
  const bannerColor = bannerColors[data?.role] || bannerColors.admin;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px',
    fontSize: '13px', outline: 'none'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>My Profile</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Your account details on CampusIQ
          </p>
        </div>
        {!editing && (
          <button onClick={startEdit} style={{
            display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px',
            background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer'
          }}>
            <Pencil size={14} /> Edit Profile
          </button>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', maxWidth: '640px' }}>
        <div style={{
          background: bannerColor,
          padding: '32px', display: 'flex', alignItems: 'center', gap: '18px', color: 'white'
        }}>
          <div style={{
            width: '68px', height: '68px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '800',
            border: '2px solid rgba(255,255,255,0.35)'
          }}>
            {initial}
          </div>
          <div>
            <p style={{ fontSize: '19px', fontWeight: '800' }}>{data?.name}</p>
            <p style={{ fontSize: '13px', color: '#dff7f4', marginTop: '2px' }}>{roleLabel} · {data?.email}</p>
          </div>
        </div>

        {!editing ? (
          <div style={{ padding: '8px' }}>
            {[
              { icon: <User size={18} />, label: 'Full Name', value: data?.name || '—' },
              { icon: <Mail size={18} />, label: 'Email', value: data?.email || '—' },
              { icon: <Shield size={18} />, label: 'Role', value: roleLabel },
              ...(data?.designation ? [{ icon: <Briefcase size={18} />, label: 'Designation', value: data.designation }] : []),
              { icon: <Phone size={18} />, label: 'Phone Number', value: data?.phone || 'Not set' },
              { icon: <Calendar size={18} />, label: 'Date of Birth', value: data?.date_of_birth ? new Date(data.date_of_birth).toLocaleDateString() : 'Not set' },
              { icon: <Building2 size={18} />, label: 'Department', value: data?.department || 'Not set' },
              { icon: <BadgeCheck size={18} />, label: 'Account Status', value: data?.status || 'Active' },
              { icon: <Calendar size={18} />, label: 'Member Since', value: data?.created_at ? new Date(data.created_at).toLocaleDateString() : '—' },
            ].map((f, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {f.icon}
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' }}>{f.label}</p>
                  <p style={{ fontSize: '14px', color: '#111827', fontWeight: '600', marginTop: '2px' }}>{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Full Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Email (cannot be changed)</label>
                <input value={data?.email || ''} disabled style={{ ...inputStyle, background: '#f9fafb', color: '#9ca3af' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Phone Number</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 9876543210" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Date of Birth</label>
                  <input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Department</label>
                <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. MCA, Computer Science" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
              <button onClick={handleSave} disabled={saving} style={{
                display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 20px',
                background: saving ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer'
              }}>
                <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)} disabled={saving} style={{
                display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 20px',
                background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer'
              }}>
                <X size={15} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;