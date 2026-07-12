import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { AlertTriangle, BrainCircuit, CheckCircle2, ClipboardList, Clock3, Flame, Gauge, MessageSquareText, Rocket, Settings2, Sparkles, TrendingUp, Wrench } from 'lucide-react';

const COLORS = ['#f59e0b', '#6366f1', '#0ea5e9', '#10b981', '#ef4444'];

const StatCard = ({ title, value, color, icon, caption }: { title: string; value: number; color: string; icon: React.ReactNode; caption: string }) => (
  <div className="ci-card" style={{ borderRadius: '18px', padding: '20px', flex: '1 1 180px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 'auto -24px -34px auto', width: '100px', height: '100px', borderRadius: '999px', background: color, opacity: 0.09 }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <span style={{ fontSize: '11px', fontWeight: 800, color, background: `${color}14`, padding: '5px 9px', borderRadius: '999px' }}>Live</span>
    </div>
    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '7px', fontWeight: 700 }}>{title}</p>
    <p style={{ fontSize: '34px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{value}</p>
    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>{caption}</p>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPrivileged = user?.role === 'super_admin' || user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const [stats, setStats] = useState<any>(null);
  const [recurringIssues, setRecurringIssues] = useState<any[]>([]);
  const [orgStats, setOrgStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/complaints/dashboard');
        setStats(res.data);
        if (isPrivileged) {
          const recurringRes = await API.get('/complaints/recurring-issues');
          setRecurringIssues(recurringRes.data);
        }
        if (isSuperAdmin) {
          const [w, d, c, r, bl, f] = await Promise.all([
            API.get('/workers'),
            API.get('/master/departments'),
            API.get('/master/categories'),
            API.get('/master/designations'),
            API.get('/master/blocks'),
            API.get('/master/floors'),
          ]);
          setOrgStats({
            totalEmployees: w.data.length,
            teamLeads: w.data.filter((wk: any) => wk.is_lead).length,
            departments: d.data.length,
            categories: c.data.length,
            designations: r.data.length,
            blocks: bl.data.length,
            floors: f.data.length,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isPrivileged, isSuperAdmin]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '420px' }}>
      <div className="ci-card" style={{ padding: '22px 28px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '12px', color: '#0f766e', fontWeight: 800 }}>
        <Gauge size={22} /> Loading campus intelligence...
      </div>
    </div>
  );

  const total = parseInt(stats?.stats?.total || 0);
  const pending = parseInt(stats?.stats?.pending || 0);
  const assigned = parseInt(stats?.stats?.assigned || 0);
  const inProgress = parseInt(stats?.stats?.in_progress || 0);
  const completed = parseInt(stats?.stats?.completed || 0);
  const active = pending + assigned + inProgress;
  const resolutionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const roleLabels: { [key: string]: string } = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    user: 'User',
  };
  const roleLabel = roleLabels[user?.role || ''] || 'there';

  const isFirstTimeUser = !isPrivileged && total === 0;

  if (isFirstTimeUser) {
    return (
      <div className="ci-page-shell">
        <section style={{
          borderRadius: '26px', padding: '48px 40px', color: 'white', overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg, #0f766e 0%, #2563eb 58%, #4f46e5 100%)',
          boxShadow: '0 24px 55px rgba(37, 99, 235, 0.22)', textAlign: 'center'
        }}>
          <div style={{ position: 'absolute', right: '-70px', top: '-80px', width: '260px', height: '260px', borderRadius: '999px', background: 'rgba(255,255,255,0.13)' }} />
          <div style={{ position: 'absolute', left: '-60px', bottom: '-90px', width: '220px', height: '220px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '540px', margin: '0 auto' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px'
            }}>
              <Rocket size={34} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '10px' }}>
              Welcome to CampusIQ, {roleLabel}!
            </h1>
            <p style={{ fontSize: '15px', color: '#dff7f4', lineHeight: 1.7, marginBottom: '30px' }}>
              You haven't raised any complaints yet. Once you do, this page will show live status updates,
              AI-powered progress tracking, and your personal resolution history — all in one place.
            </p>
            <button
              onClick={() => navigate('/complaints/raise')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '9px', padding: '13px 26px',
                background: 'white', color: '#0f766e', border: 'none', borderRadius: '999px',
                fontSize: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 12px 28px rgba(0,0,0,0.14)'
              }}
            >
              <MessageSquareText size={17} /> Raise Your First Complaint
            </button>
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '22px' }}>
          {[
            { icon: <Sparkles size={20} />, title: 'AI-Powered Analysis', text: 'Just describe your issue in plain English — our AI detects the category and priority automatically.' },
            { icon: <TrendingUp size={20} />, title: 'Live Status Tracking', text: 'Follow your complaint from Pending to Completed, with real-time updates at every step.' },
            { icon: <CheckCircle2 size={20} />, title: 'Rate & Give Feedback', text: 'Once resolved, share feedback to help us keep improving service quality across campus.' },
          ].map((card, i) => (
            <div key={i} className="ci-card" style={{ borderRadius: '18px', padding: '22px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: '#0f766e14', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                {card.icon}
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>{card.title}</h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Pending', value: pending },
    { name: 'Assigned', value: assigned },
    { name: 'In Progress', value: inProgress },
    { name: 'Completed', value: completed },
  ].filter(d => d.value > 0);

  return (
    <div className="ci-page-shell">
      <section style={{
        borderRadius: '26px', padding: '28px', color: 'white', marginBottom: '22px', overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, #0f766e 0%, #2563eb 58%, #4f46e5 100%)',
        boxShadow: '0 24px 55px rgba(37, 99, 235, 0.22)'
      }}>
        <div style={{ position: 'absolute', right: '-70px', top: '-80px', width: '260px', height: '260px', borderRadius: '999px', background: 'rgba(255,255,255,0.13)' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 11px', borderRadius: '999px', background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.22)', marginBottom: '14px', fontSize: '12px', fontWeight: 800 }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '999px', background: '#4ade80', display: 'inline-block',
                boxShadow: '0 0 0 0 rgba(74, 222, 128, 0.7)', animation: 'ciPulse 1.8s infinite'
              }} />
              <Sparkles size={15} /> {isPrivileged ? 'AI-Powered Campus Operations' : 'AI-Powered Complaint Tracking'}
            </div>
            <h1 style={{ fontSize: '34px', lineHeight: 1.08, fontWeight: 900, letterSpacing: 0, marginBottom: '8px' }}>
              {isPrivileged ? 'Mission Control for Campus Operations' : `Welcome back, ${roleLabel}`}
            </h1>
            <p style={{ fontSize: '15px', color: '#dff7f4', maxWidth: '680px', lineHeight: 1.7 }}>
              {isPrivileged
                ? 'Monitor complaints, recurring infrastructure issues, service progress, and AI insights from one clean control center.'
                : 'Track the complaints you\'ve raised, see live status updates, and get AI-powered progress at a glance.'}
            </p>
            {isPrivileged && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginTop: '12px', padding: '6px 12px', borderRadius: '999px', background: 'rgba(255,255,255,0.14)', fontSize: '12px', fontWeight: 700 }}>
                <Flame size={13} />
                {recurringIssues.length > 0
                  ? `${recurringIssues.length} recurring issue${recurringIssues.length > 1 ? 's' : ''} flagged this week`
                  : 'No recurring issues this week — all clear'}
              </div>
            )}
          </div>
          <div style={{ minWidth: '220px', padding: '18px', borderRadius: '20px', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.20)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: '18px' }}>
            <svg width="88" height="88" viewBox="0 0 88 88" style={{ flexShrink: 0 }}>
              <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="9" />
              <circle
                cx="44" cy="44" r="38" fill="none" stroke="#a7f3d0" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - resolutionRate / 100)}`}
                transform="rotate(-90 44 44)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              <text x="44" y="49" textAnchor="middle" fontSize="19" fontWeight="900" fill="white">{resolutionRate}%</text>
            </svg>
            <div>
              <div style={{ fontSize: '12px', color: '#ccfbf1', fontWeight: 800 }}>{isPrivileged ? 'Resolution Rate' : 'Your Resolution Rate'}</div>
              <div style={{ fontSize: '12px', color: '#dff7f4', marginTop: '4px', maxWidth: '110px', lineHeight: 1.4 }}>
                {completed} of {total} resolved
              </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes ciPulse {
          0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6); }
          70% { box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
          100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }
      `}</style>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '22px', flexWrap: 'wrap' }}>
        <StatCard title="Total Complaints" value={total} color="#2563eb" icon={<ClipboardList size={21} />} caption="All service requests" />
        <StatCard title="Pending" value={pending} color="#f59e0b" icon={<Clock3 size={21} />} caption="Waiting for review" />
        <StatCard title="Assigned" value={assigned} color="#6366f1" icon={<Wrench size={21} />} caption="Worker allocated" />
        <StatCard title="In Progress" value={inProgress} color="#0ea5e9" icon={<TrendingUp size={21} />} caption="Work underway" />
        <StatCard title="Completed" value={completed} color="#10b981" icon={<CheckCircle2 size={21} />} caption="Resolved cases" />
      </div>

      {isSuperAdmin && orgStats && (
        <div style={{ borderRadius: '20px', padding: '22px', marginBottom: '22px', background: 'linear-gradient(135deg, #312e81 0%, #6d28d9 100%)', color: 'white', boxShadow: '0 20px 45px rgba(109, 40, 217, 0.20)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Settings2 size={22} />
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 900 }}>System Overview</h3>
              <p style={{ fontSize: '12px', color: '#ddd6fe' }}>Org-wide setup — only visible to Super Admin</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Employees', value: orgStats.totalEmployees },
              { label: 'Team Leads', value: orgStats.teamLeads },
              { label: 'Departments', value: orgStats.departments },
              { label: 'Categories', value: orgStats.categories },
              { label: 'Designations', value: orgStats.designations },
              { label: 'Blocks / Floors', value: `${orgStats.blocks} / ${orgStats.floors}` },
            ].map(item => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '13px 14px' }}>
                <p style={{ fontSize: '11px', color: '#ddd6fe', marginBottom: '4px', fontWeight: 700 }}>{item.label}</p>
                <p style={{ fontSize: '22px', fontWeight: 900 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isPrivileged && recurringIssues.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #ea580c 100%)', borderRadius: '20px', padding: '22px', marginBottom: '22px', color: 'white', boxShadow: '0 20px 45px rgba(234, 88, 12, 0.20)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Flame size={22} />
            <h3 style={{ fontSize: '17px', fontWeight: 900 }}>Recurring Issues Detected</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#ffedd5', marginBottom: '15px' }}>
            Similar complaints repeated 3+ times in one location within 7 days. These are auto-escalated to Critical.
          </p>
          <div style={{ display: 'grid', gap: '10px' }}>
            {recurringIssues.map((issue: any, i: number) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.13)', borderRadius: '13px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 850 }}>{issue.category} - {issue.block_name || 'Unknown Block'} ({issue.building_name || 'Unknown Building'})</p>
                  <p style={{ fontSize: '12px', color: '#fed7aa', marginTop: '3px' }}>Last reported: {new Date(issue.latest_complaint_at).toLocaleDateString()}</p>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 900, padding: '6px 12px', background: 'white', color: '#c2410c', borderRadius: '999px' }}>{issue.occurrence_count}x this week</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 0.85fr)', gap: '18px', marginBottom: '22px' }}>
        <div className="ci-card" style={{ borderRadius: '20px', padding: '22px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>Complaints by Category</h3>
          {stats?.categoryStats?.length > 0 ? (
            <ResponsiveContainer width="100%" height={255}>
              <BarChart data={stats.categoryStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: 'rgba(15,118,110,0.08)' }} />
                <Bar dataKey="count" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState text="No category data yet" />}
        </div>

        <div className="ci-card" style={{ borderRadius: '20px', padding: '22px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>Status Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={255}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="48%" innerRadius={48} outerRadius={82} paddingAngle={4} dataKey="value">
                  {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyState text="No status data yet" />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.9fr) minmax(0, 1.4fr)', gap: '18px' }}>
        <div style={{ borderRadius: '20px', padding: '22px', color: 'white', background: 'linear-gradient(135deg, #172033, #0f766e)', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.16)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <BrainCircuit size={23} />
            <h3 style={{ fontSize: '17px', fontWeight: 900 }}>AI Insights</h3>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { label: 'Most Reported Issue', value: stats?.categoryStats?.[0]?.category || 'N/A' },
              { label: 'Active Complaints', value: active.toString() },
              { label: 'Resolution Rate', value: `${resolutionRate}%` },
              { label: 'AI Status', value: 'Active' },
            ].map((item) => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '14px', padding: '13px 14px' }}>
                <p style={{ fontSize: '12px', color: '#ccfbf1', marginBottom: '4px' }}>{item.label}</p>
                <p style={{ fontSize: '21px', fontWeight: 900 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="ci-card" style={{ borderRadius: '20px', padding: '22px', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', marginBottom: '16px' }}>Recent Complaints</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Title', 'Category', 'Priority', 'Status', 'Date'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {stats?.recentComplaints?.length > 0 ? stats.recentComplaints.map((c: any) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={tdMuted}>{c.complaint_id}</td>
                    <td style={{ ...tdStyle, fontWeight: 800, color: '#0f172a' }}>{c.title}</td>
                    <td style={tdMuted}>{c.category}</td>
                    <td style={tdStyle}><Badge value={c.priority} type="priority" /></td>
                    <td style={tdStyle}><Badge value={c.status} type="status" /></td>
                    <td style={tdMuted}>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} style={{ padding: '34px', textAlign: 'center', color: '#94a3b8' }}>No complaints yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div style={{ height: '255px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '8px' }}>
    <AlertTriangle size={18} /> {text}
  </div>
);

const thStyle: React.CSSProperties = { padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0 };
const tdStyle: React.CSSProperties = { padding: '13px 12px', fontSize: '13px' };
const tdMuted: React.CSSProperties = { ...tdStyle, color: '#64748b' };

const Badge = ({ value, type }: { value: string; type: 'priority' | 'status' }) => {
  const danger = value === 'High' || value === 'Critical';
  const success = value === 'Completed' || value === 'Low';
  const bg = danger ? '#fee2e2' : success ? '#dcfce7' : type === 'status' ? '#e0f2fe' : '#fef3c7';
  const color = danger ? '#dc2626' : success ? '#15803d' : type === 'status' ? '#0369a1' : '#b45309';
  return <span style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '999px', fontWeight: 850, background: bg, color }}>{value}</span>;
};

export default Dashboard;