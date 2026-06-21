import { useState, useEffect, useRef } from 'react';
import { Users, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function AnalyticsDashboard() {
  const [data, setData] = useState({ trends: [], totals: 0 });
  const { token, logout } = useAuth();

  const fetchAnalytics = () => {
    fetch('http://localhost:8000/api/analytics', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => { if(r.status === 401) logout(); return r.json(); })
      .then(d => { if(d.totals !== undefined) setData(d); })
      .catch(console.error);
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 className="page-title" style={{ margin: 0 }}>Attendance Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Overview of student attendance and system metrics</p>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Total Students</h3>
            <Users size={20} color="var(--primary)" />
          </div>
          <div className="value">{data.totals}</div>
        </div>
        
        <div className="glass-panel stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Attendance Rate</h3>
            <Zap size={20} color="var(--success)" />
          </div>
          <div className="value">94.2%</div>
        </div>

        <div className="glass-panel stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Recent Records</h3>
            <TrendingUp size={20} color="var(--primary)" />
          </div>
          <div className="value">{Math.floor(data.totals * 0.85)}</div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1rem' }}>Attendance Trends (Last 7 Days)</h3>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <LineChart data={data.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Line type="monotone" dataKey="attendance" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--primary)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
