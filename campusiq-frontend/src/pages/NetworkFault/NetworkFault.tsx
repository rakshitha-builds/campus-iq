import { useState, useEffect } from 'react';
import API from '../../utils/api';

interface Cluster {
  id: string;
  building: string;
  block: string;
  floor: string;
  category: string;
  complaints: any[];
  count: number;
  timeSpanMinutes: number;
  severity: 'High' | 'Medium' | 'Low';
}

const NetworkFault = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string>('');

  useEffect(() => {
    fetchAndAnalyze();
  }, []);

  const fetchAndAnalyze = async () => {
    setLoading(true);
    try {
      const res = await API.get('/complaints');
      setComplaints(res.data);
      runClusterDetection(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runClusterDetection = (data: any[]) => {
    setScanning(true);

    setTimeout(() => {
      // Only look at non-resolved complaints from last 7 days for relevance
      const recent = data.filter((c: any) => {
        const createdAt = new Date(c.created_at);
        const daysDiff = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7 && c.status !== 'Completed';
      });

      // Group by building + block + floor + category
      const groups: { [key: string]: any[] } = {};
      recent.forEach((c: any) => {
        const key = `${c.building_name || 'Unknown'}|${c.block_name || 'Unknown'}|${c.floor_name || 'Unknown'}|${c.category || c.ai_category || 'General'}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
      });

      // A cluster is meaningful when 2+ complaints share location+category
      const detectedClusters: Cluster[] = [];
      Object.entries(groups).forEach(([key, items]) => {
        if (items.length >= 2) {
          const [building, block, floor, category] = key.split('|');
          const times = items.map((i: any) => new Date(i.created_at).getTime());
          const spanMinutes = Math.round((Math.max(...times) - Math.min(...times)) / 60000);

          let severity: 'High' | 'Medium' | 'Low' = 'Low';
          if (items.length >= 4) severity = 'High';
          else if (items.length === 3) severity = 'Medium';

          detectedClusters.push({
            id: key,
            building,
            block,
            floor,
            category,
            complaints: items,
            count: items.length,
            timeSpanMinutes: spanMinutes,
            severity,
          });
        }
      });

      detectedClusters.sort((a, b) => b.count - a.count);
      setClusters(detectedClusters);
      setScanning(false);
      setLastScan(new Date().toLocaleTimeString());
    }, 1800);
  };

  const getRecommendation = (cluster: Cluster) => {
    if (cluster.category === 'Internet') {
      return `Likely a shared network switch or LAN cable failure for ${cluster.block}, ${cluster.floor}. Check the floor switch before checking individual computers.`;
    }
    if (cluster.category === 'Electrical') {
      return `Likely a shared circuit breaker or main electrical line for ${cluster.block}, ${cluster.floor}. Check the main panel before checking individual sockets.`;
    }
    if (cluster.category === 'Plumbing') {
      return `Likely a shared pipe or valve issue for ${cluster.block}, ${cluster.floor}. Check the main water line before checking individual taps.`;
    }
    return `Multiple related issues detected in the same area. Investigate the shared infrastructure point before checking individual units.`;
  };

  const severityColor = (s: string) => {
    if (s === 'High') return { bg: '#fee2e2', color: '#dc2626', bar: '#dc2626' };
    if (s === 'Medium') return { bg: '#fef3c7', color: '#d97706', bar: '#f59e0b' };
    return { bg: '#eff6ff', color: '#2563eb', bar: '#3b82f6' };
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <p style={{ color: '#6b7280' }}>Loading complaint data...</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>Network Fault Pattern Detector</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            AI scans campus-wide complaints to detect shared infrastructure failures
          </p>
        </div>
        <button
          onClick={() => fetchAndAnalyze()}
          disabled={scanning}
          style={{
            padding: '10px 20px', background: scanning ? '#93c5fd' : '#2563eb',
            color: 'white', border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: '500', cursor: 'pointer'
          }}
        >
          {scanning ? 'Scanning...' : 'Run New Scan'}
        </button>
      </div>

      {/* Info Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', color: 'white'
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
          🔍 How It Works
        </h3>
        <p style={{ fontSize: '13px', color: '#bfdbfe', lineHeight: '1.6' }}>
          When multiple complaints of the same category appear in the same building, block and floor within a short time window,
          the AI flags it as one shared infrastructure failure (cable, switch, circuit, pipe) instead of separate individual problems —
          telling admin exactly where to check first across the entire campus.
        </p>
        {lastScan && (
          <p style={{ fontSize: '11px', color: '#93c5fd', marginTop: '8px' }}>Last scan: {lastScan}</p>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Complaints Scanned', value: complaints.length, color: '#2563eb' },
          { label: 'Clusters Detected', value: clusters.length, color: '#dc2626' },
          { label: 'High Severity', value: clusters.filter(c => c.severity === 'High').length, color: '#dc2626' },
          { label: 'Isolated Issues', value: complaints.length - clusters.reduce((a, c) => a + c.count, 0), color: '#16a34a' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, background: 'white', borderRadius: '12px',
            padding: '16px 20px', border: '1px solid #e5e7eb',
            borderLeft: `4px solid ${s.color}`
          }}>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Scanning State */}
      {scanning && (
        <div style={{
          background: 'white', borderRadius: '12px', padding: '40px',
          textAlign: 'center', border: '1px solid #e5e7eb', marginBottom: '20px'
        }}>
          <div style={{
            width: '48px', height: '48px', border: '3px solid #2563eb',
            borderTop: '3px solid transparent', borderRadius: '50%',
            margin: '0 auto 16px', animation: 'spin 1s linear infinite'
          }} />
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
            Scanning campus-wide complaint data...
          </p>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
            Analyzing location, category and time patterns
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Clusters */}
      {!scanning && (
        clusters.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>✅</p>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>No fault clusters detected</p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
              All active complaints appear to be isolated, individual issues — no shared infrastructure failures found
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {clusters.map((cluster) => {
              const sc = severityColor(cluster.severity);
              return (
                <div key={cluster.id} style={{
                  background: 'white', borderRadius: '12px', padding: '20px',
                  border: '1px solid #e5e7eb', borderLeft: `4px solid ${sc.bar}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '11px', padding: '3px 10px', borderRadius: '10px',
                          background: sc.bg, color: sc.color, fontWeight: '600'
                        }}>
                          {cluster.severity} Priority Cluster
                        </span>
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '10px', background: '#f3f4f6', color: '#6b7280', fontWeight: '500' }}>
                          {cluster.category}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                        {cluster.building} — {cluster.block}, {cluster.floor}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                        {cluster.count} related complaints within {cluster.timeSpanMinutes} minutes
                      </p>
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  <div style={{
                    background: '#fef9c3', border: '1px solid #fde68a',
                    borderRadius: '8px', padding: '12px 14px', marginBottom: '14px'
                  }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                      AI Recommendation
                    </p>
                    <p style={{ fontSize: '13px', color: '#78350f', lineHeight: '1.5' }}>
                      {getRecommendation(cluster)}
                    </p>
                  </div>

                  {/* Related Complaints */}
                  <p style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Related complaints in this cluster:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {cluster.complaints.map((c: any) => (
                      <div key={c.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', background: '#f9fafb', borderRadius: '6px'
                      }}>
                        <span style={{ fontSize: '12px', color: '#374151' }}>
                          <strong>{c.complaint_id}</strong> — {c.title}
                        </span>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default NetworkFault;