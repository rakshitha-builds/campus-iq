import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';
import { toast } from 'react-toastify';
import { ArrowRight, Building2, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';

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
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirect');
      navigate(redirectUrl ? decodeURIComponent(redirectUrl) : '/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ci-login-grid">
      <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '34px' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #0f766e, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 16px 30px rgba(37, 99, 235, 0.24)'
            }}>
              <Building2 size={25} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '23px', fontWeight: 800, color: '#102033' }}>CampusIQ</h1>
              <p style={{ fontSize: '13px', color: '#64748b' }}>Smart Campus Operations Platform</p>
            </div>
          </div>

          <div className="ci-card" style={{ borderRadius: '22px', padding: '26px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '7px 11px', borderRadius: '999px', background: '#ecfdf5',
              color: '#047857', fontSize: '12px', fontWeight: 700, marginBottom: '18px'
            }}>
              <Sparkles size={14} /> AI-enabled campus desk
            </div>

            <h2 style={{ fontSize: '30px', lineHeight: 1.12, fontWeight: 850, color: '#0f172a', marginBottom: '10px' }}>
              Sign in to your digital campus control room
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '24px' }}>
              Raise complaints, assign work, track assets, publish notices, and monitor campus services from one polished portal.
            </p>

            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Role</label>
              <select className="ci-input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} required style={{ marginBottom: '15px' }}>
                <option value="">Select your role</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>

              <label style={labelStyle}>Campus Email</label>
              <div style={{ position: 'relative', marginBottom: '15px' }}>
                <Mail size={17} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input className="ci-input" type="email" placeholder="name@campus.edu" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required style={{ paddingLeft: '42px' }} />
              </div>

              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative', marginBottom: '18px' }}>
                <Lock size={17} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input className="ci-input" type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required style={{ paddingLeft: '42px', paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
                  <input type="checkbox" /> Remember me
                </label>
                <span style={{ fontSize: '13px', color: '#0f766e', fontWeight: 700, cursor: 'pointer' }}>Forgot Password?</span>
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', minHeight: '48px', border: 'none', borderRadius: '13px',
                background: loading ? '#99f6e4' : 'linear-gradient(135deg, #0f766e, #2563eb)',
                color: 'white', fontSize: '15px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 18px 35px rgba(15, 118, 110, 0.24)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
              }}>
                {loading ? 'Signing in...' : 'Enter CampusIQ'} {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="ci-login-visual" style={{ display: 'flex', alignItems: 'center', padding: '54px' }}>
        <div style={{ maxWidth: '620px', color: 'white' }}>
          <h2 style={{ fontSize: '48px', lineHeight: 1.1, fontWeight: 900, marginBottom: '18px' }}>
            One campus. Every service. Smarter decisions.
          </h2>
          <p style={{ color: '#dff7f4', fontSize: '17px', lineHeight: 1.7, maxWidth: '520px' }}>
            AI complaint classification, QR guest reporting, and campus service management in one platform.
          </p>
        </div>
      </section>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 750, color: '#334155', marginBottom: '7px'
};

export default Login;