import { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [stats, setStats] = useState({ total_students: 0, present_today: 0 });
  const { token, logout } = useAuth();

  useEffect(() => {
    fetch('http://localhost:8000/api/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => {
        if(r.status === 401) logout();
        return r.json();
      })
      .then(data => { if(data.total_students !== undefined) setStats(data); })
      .catch(e => console.error(e));
  }, [token]);

  return (
    <div>
      <h2 className="page-title">Dashboard Overview</h2>
      
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <h3>Total Enrolled</h3>
          <div className="value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={32} color="var(--primary)" />
            {stats.total_students}
          </div>
        </div>

        <div className="glass-panel stat-card">
          <h3>Present Today</h3>
          <div className="value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={32} color="var(--success)" />
            {stats.present_today}
          </div>
        </div>

        <div className="glass-panel stat-card">
          <h3>Current Time</h3>
          <div className="value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem' }}>
            <Clock size={32} color="var(--text-muted)" />
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      
      <div className="glass-panel">
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>System Status</h3>
        <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></span>
          Backend API is Online
        </p>
      </div>
    </div>
  );
}
