import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { AlertTriangle, BrainCircuit, CheckCircle2, ClipboardList, Clock3, Flame, Gauge, Sparkles, TrendingUp, Wrench } from 'lucide-react';

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
  const isPrivileged = user?.role === 'super_admin' || user?.role === 'admin';
  const [stats, setStats] = useState<any>(null);
  const [recurringIssues, setRecurringIssues] = useState<any[]>([]);
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isPrivileged]);

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
              <Sparkles size={15} /> AI-Powered Campus Operations
            </div>
            <h1 style={{ fontSize: '34px', lineHeight: 1.08, fontWeight: 900, letterSpacing: 0, marginBottom: '8px' }}>Campus Command Dashboard</h1>
            <p style={{ fontSize: '15px', color: '#dff7f4', maxWidth: '680px', lineHeight: 1.7 }}>
              Monitor complaints, recurring infrastructure issues, service progress, and AI insights from one clean control center.
            </p>
          </div>
          <div style={{ minWidth: '220px', padding: '18px', borderRadius: '20px', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.20)', backdropFilter: 'blur(12px)' }}>
            <div style={{ fontSize: '12px', color: '#ccfbf1', fontWeight: 800 }}>Resolution Rate</div>
            <div style={{ fontSize: '42px', fontWeight: 950, lineHeight: 1, marginTop: '8px' }}>{resolutionRate}%</div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.22)', borderRadius: '999px', overflow: 'hidden', marginTop: '14px' }}>
              <div style={{ width: `${resolutionRate}%`, height: '100%', background: '#a7f3d0', borderRadius: '999px' }} />
            </div>
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '22px', flexWrap: 'wrap' }}>
        <StatCard title="Total Complaints" value={total} color="#2563eb" icon={<ClipboardList size={21} />} caption="All service requests" />
        <StatCard title="Pending" value={pending} color="#f59e0b" icon={<Clock3 size={21} />} caption="Waiting for review" />
        <StatCard title="Assigned" value={assigned} color="#6366f1" icon={<Wrench size={21} />} caption="Worker allocated" />
        <StatCard title="In Progress" value={inProgress} color="#0ea5e9" icon={<TrendingUp size={21} />} caption="Work underway" />
        <StatCard title="Completed" value={completed} color="#10b981" icon={<CheckCircle2 size={21} />} caption="Resolved cases" />
      </div>

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
