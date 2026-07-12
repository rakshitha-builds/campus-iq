import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../utils/api';
import { toast } from 'react-toastify';
import { ArrowRight, Building2, Eye, EyeOff, Lock, Mail, Sparkles, User } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', department: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await API.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        department: formData.department,
      });
      toast.success('Account created! You can now sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
              <Sparkles size={14} /> For Students & Staff
            </div>

            <h2 style={{ fontSize: '28px', lineHeight: 1.12, fontWeight: 850, color: '#0f172a', marginBottom: '10px' }}>
              Create your campus account
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '24px' }}>
              Sign up to raise complaints, track their status, and book campus resources.
            </p>

            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: 'relative', marginBottom: '15px' }}>
                <User size={17} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input className="ci-input" type="text" placeholder="Your full name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={{ paddingLeft: '42px' }} />
              </div>

              <label style={labelStyle}>Campus Email</label>
              <div style={{ position: 'relative', marginBottom: '15px' }}>
                <Mail size={17} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input className="ci-input" type="email" placeholder="name@campus.edu" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required style={{ paddingLeft: '42px' }} />
              </div>

              <label style={labelStyle}>Department (optional)</label>
              <input className="ci-input" type="text" placeholder="e.g. MCA, Computer Science" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} style={{ marginBottom: '15px' }} />

              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative', marginBottom: '15px' }}>
                <Lock size={17} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input className="ci-input" type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required style={{ paddingLeft: '42px', paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <Lock size={17} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input className="ci-input" type={showPassword ? 'text' : 'password'} placeholder="Re-enter password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} required style={{ paddingLeft: '42px' }} />
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', minHeight: '48px', border: 'none', borderRadius: '13px',
                background: loading ? '#99f6e4' : 'linear-gradient(135deg, #0f766e, #2563eb)',
                color: 'white', fontSize: '15px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 18px 35px rgba(15, 118, 110, 0.24)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
              }}>
                {loading ? 'Creating account...' : 'Create Account'} {!loading && <ArrowRight size={18} />}
              </button>

              <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '18px' }}>
                Already have an account? <Link to="/login" style={{ color: '#0f766e', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
              </p>
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

export default Register;