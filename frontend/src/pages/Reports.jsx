import { useState, useEffect } from 'react';
import { Calendar, Download, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const { token, logout } = useAuth();

  useEffect(() => { fetchRecords(filterDate); }, [filterDate]);

  const fetchRecords = (date) => {
    const url = date ? `http://localhost:8000/api/attendance?date=${date}` : `http://localhost:8000/api/attendance`;
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => { if(r.status === 401) logout(); return r.json(); })
      .then(d => { if(Array.isArray(d)) setRecords(d); })
      .catch(console.error);
  };

  const exportCSV = () => {
    if (records.length === 0) return alert("No records");
    const headers = ["ID", "Student Name", "Branch", "Date", "Time", "Status", "Manual Override"];
    const rows = [headers.join(',')];
    records.forEach(r => rows.push([r.id, r.name, r.branch, r.date, r.time, r.status, r.is_manual ? 'Yes' : 'No'].join(',')));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_Report_${filterDate || 'All'}.csv`;
    a.click();
  };

  const overrideAttendance = async (id, currentStatus) => {
    const newStatus = prompt(`Override status for record ID ${id} (e.g. Present, Absent, Excused)?`, currentStatus);
    if (!newStatus || newStatus === currentStatus) return;

    const fd = new URLSearchParams();
    fd.append("status", newStatus);

    await fetch(`http://localhost:8000/api/attendance/${id}/edit`, {
      method: "POST",
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: fd
    });
    fetchRecords(filterDate);
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="page-title" style={{ margin: 0 }}>Attendance Reports</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>View and export historical student attendance records</p>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Calendar size={20} color="var(--primary)" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 600 }}>Filter by Date:</label>
          <input 
            type="date" 
            className="form-input" 
            style={{ width: 'auto' }}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" onClick={() => setFilterDate('')} style={{ background: '#f8fafc', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
            Show All
          </button>
          <button className="btn" onClick={exportCSV}>
            <Download size={18} /> Download Excel/CSV
          </button>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Registration Date & Time</th>
                <th>Student Detail</th>
                <th>Status</th>
                <th>Method</th>
                <th style={{ textAlign: 'center' }}>Management</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>{r.date} <span style={{color: 'var(--text-muted)', marginLeft: '0.5rem'}}>{r.time}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.branch}</div>
                  </td>
                  <td>
                    <span className="status-badge" style={{
                      background: r.status === 'Absent' ? '#fef2f2' : '#f0fdf4',
                      color: r.status === 'Absent' ? '#ef4444' : '#16a34a'
                    }}>{r.status}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {r.is_manual ? <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Manual Override</span> : <span style={{ color: 'var(--text-muted)' }}>Automated Scan</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => overrideAttendance(r.id, r.status)}>
                      <Edit size={14} /> Update
                    </button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No attendance records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
