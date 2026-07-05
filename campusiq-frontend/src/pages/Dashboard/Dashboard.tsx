import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

const StatCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
  <div style={{
    background: 'white', borderRadius: '12px', padding: '24px',
    border: '1px solid #e5e7eb', flex: 1,
    borderLeft: `4px solid ${color}`
  }}>
    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>{title}</p>
    <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>{value}</p>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/complaints/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading dashboard...</p>
    </div>
  );

  const pieData = [
    { name: 'Pending', value: parseInt(stats?.stats?.pending || 0) },
    { name: 'Assigned', value: parseInt(stats?.stats?.assigned || 0) },
    { name: 'In Progress', value: parseInt(stats?.stats?.in_progress || 0) },
    { name: 'Completed', value: parseInt(stats?.stats?.completed || 0) },
  ].filter(d => d.value > 0);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Dashboard</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
          AI-Powered Campus Operations Overview
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <StatCard title="Total Complaints" value={parseInt(stats?.stats?.total || 0)} color="#2563eb" />
        <StatCard title="Pending" value={parseInt(stats?.stats?.pending || 0)} color="#f59e0b" />
        <StatCard title="Assigned" value={parseInt(stats?.stats?.assigned || 0)} color="#8b5cf6" />
        <StatCard title="In Progress" value={parseInt(stats?.stats?.in_progress || 0)} color="#3b82f6" />
        <StatCard title="Completed" value={parseInt(stats?.stats?.completed || 0)} color="#10b981" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {/* Bar Chart */}
        <div style={{
          flex: 2, background: 'white', borderRadius: '12px',
          padding: '24px', border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            Complaints by Category
          </h3>
          {stats?.categoryStats?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.categoryStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#9ca3af' }}>No data yet</p>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div style={{
          flex: 1, background: 'white', borderRadius: '12px',
          padding: '24px', border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            Status Distribution
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#9ca3af' }}>No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights Panel */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        borderRadius: '12px', padding: '24px', marginBottom: '24px', color: 'white'
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>
          AI Insights
        </h3>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'Most Reported Issue', value: stats?.categoryStats?.[0]?.category || 'N/A' },
            { label: 'Total Active Complaints', value: (parseInt(stats?.stats?.pending || 0) + parseInt(stats?.stats?.assigned || 0) + parseInt(stats?.stats?.in_progress || 0)).toString() },
            { label: 'Resolution Rate', value: stats?.stats?.total > 0 ? `${Math.round((stats?.stats?.completed / stats?.stats?.total) * 100)}%` : '0%' },
            { label: 'AI Status', value: 'Active' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.1)', borderRadius: '10px',
              padding: '16px 20px', flex: 1, minWidth: '150px'
            }}>
              <p style={{ fontSize: '12px', color: '#bfdbfe', marginBottom: '6px' }}>{item.label}</p>
              <p style={{ fontSize: '20px', fontWeight: '700' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Complaints */}
      <div style={{
        background: 'white', borderRadius: '12px',
        padding: '24px', border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
          Recent Complaints
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
              {['ID', 'Title', 'Category', 'Priority', 'Status', 'Date'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats?.recentComplaints?.length > 0 ? stats.recentComplaints.map((c: any) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>{c.complaint_id}</td>
                <td style={{ padding: '12px', fontSize: '13px', fontWeight: '500', color: '#111827' }}>{c.title}</td>
                <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>{c.category}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    fontSize: '12px', padding: '3px 10px', borderRadius: '20px', fontWeight: '500',
                    background: c.priority === 'High' || c.priority === 'Critical' ? '#fee2e2' : c.priority === 'Medium' ? '#fef3c7' : '#f0fdf4',
                    color: c.priority === 'High' || c.priority === 'Critical' ? '#dc2626' : c.priority === 'Medium' ? '#d97706' : '#16a34a'
                  }}>
                    {c.priority}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    fontSize: '12px', padding: '3px 10px', borderRadius: '20px', fontWeight: '500',
                    background: c.status === 'Completed' ? '#f0fdf4' : c.status === 'Pending' ? '#fef3c7' : '#eff6ff',
                    color: c.status === 'Completed' ? '#16a34a' : c.status === 'Pending' ? '#d97706' : '#2563eb'
                  }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                  No complaints yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;