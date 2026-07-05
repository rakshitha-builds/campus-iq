import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role) { toast.error('Please select a role'); return; }
    setLoading(true);
    try {
      const res = await API.post('/auth/login', formData);
      login(res.data.token, res.data.user);
toast.success('Welcome to CampusIQ!');
// Check if there's a redirect URL from QR code
const params = new URLSearchParams(window.location.search);
const redirectUrl = params.get('redirect');
if (redirectUrl) {
  navigate(decodeURIComponent(redirectUrl));
} else {
  navigate('/dashboard');
}
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Left Panel */}
      <div style={{
        width: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        background: 'white'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{
              width: '44px', height: '44px',
              background: '#2563eb', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>CQ</span>
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>CampusIQ</h1>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Intelligent Campus Operations Platform</p>
            </div>
          </div>

          {/* Info box */}
          <div style={{
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: '12px', padding: '16px', marginBottom: '24px'
          }}>
            <p style={{ fontSize: '14px', color: '#1d4ed8', lineHeight: '1.5' }}>
              Staff and Students can raise, track, and manage campus maintenance issues with AI assistance.
            </p>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '24px' }}>
            Login to Portal
          </h2>

          <form onSubmit={handleSubmit}>

            {/* Role */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Role <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                required
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #d1d5db', borderRadius: '8px',
                  fontSize: '14px', outline: 'none', background: 'white',
                  cursor: 'pointer', color: '#111827'
                }}
              >
                <option value="">Select Role</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Campus Email <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="email"
                placeholder="Enter your campus email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #d1d5db', borderRadius: '8px',
                  fontSize: '14px', outline: 'none', color: '#111827'
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Password <span style={{ color: 'red' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '10px 40px 10px 12px',
                    border: '1px solid #d1d5db', borderRadius: '8px',
                    fontSize: '14px', outline: 'none', color: '#111827'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', fontSize: '14px',
                    color: '#6b7280'
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}>
                <input type="checkbox" />
                Remember Me
              </label>
              <span style={{ fontSize: '14px', color: '#2563eb', cursor: 'pointer' }}>
                Forgot Password?
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? '#93c5fd' : '#2563eb',
                color: 'white', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '600', cursor: 'pointer'
              }}
            >
              {loading ? 'Signing in...' : 'Login to Portal'}
            </button>

          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '16px' }}>
            Only authorized campus users can access this portal.
          </p>

        </div>
      </div>

      {/* Right Panel */}
      <div style={{
        width: '50%',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px'
      }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>

          <h2 style={{ fontSize: '40px', fontWeight: '800', color: 'white', marginBottom: '16px' }}>
            CampusIQ
          </h2>

          <p style={{ color: '#bfdbfe', fontSize: '18px', marginBottom: '48px', lineHeight: '1.6' }}>
            AI-Powered Campus Operations & Intelligent Maintenance Platform
          </p>

          <div style={{ textAlign: 'left' }}>
            {[
              'AI-Powered Complaint Analysis',
              'Predictive Maintenance Engine',
              'Intelligent Analytics Dashboard',
              'Smart Asset Management',
              'Room and Resource Booking',
            ].map((text, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#60a5fa', flexShrink: 0
                }} />
                <span style={{ color: '#dbeafe', fontWeight: '500', fontSize: '16px' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>

          <p style={{ color: '#93c5fd', fontSize: '13px', marginTop: '48px' }}>
            © 2026 CampusIQ 
          </p>

        </div>
      </div>

    </div>
  );
};

export default Login;