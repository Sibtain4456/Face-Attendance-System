import { useState, useEffect } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', branch: '' });
  const [files, setFiles] = useState([]);

  const { token, logout } = useAuth();

  const fetchStudents = () => {
    fetch('http://localhost:8000/api/students', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => {
        if(r.status === 401) logout();
        return r.json();
      })
      .then(data => { if(Array.isArray(data)) setStudents(data); })
      .catch(console.error);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return alert("Please select at least one clear photo of the face.");
    
    setLoading(true);
    const data = new FormData();
    data.append("name", formData.name);
    data.append("branch", formData.branch);
    
    // Append all selected files
    for (let i = 0; i < files.length; i++) {
      data.append("files", files[i]);
    }

    try {
      const resp = await fetch('http://localhost:8000/api/students', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });
      if (resp.ok) {
        setFormData({ name: '', branch: '' });
        setFiles([]);
        fetchStudents();
      } else {
        const err = await resp.json();
        alert(err.detail || "Registration failed");
      }
    } catch (e) {
      alert("Network error");
    }
    setLoading(false);
  };

  const deleteStudent = async (id) => {
    if (!confirm("Are you sure you want to delete this student and their attendance records?")) return;
    
    try {
      const resp = await fetch(`http://localhost:8000/api/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) fetchStudents();
    } catch(e) {
      alert("Failed to delete");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 className="page-title" style={{ margin: 0 }}>Enrollment Management</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>Add or remove student identities from the recognition database</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2.5rem', alignItems: 'start' }}>
        <div className="glass-panel" style={{ position: 'sticky', top: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 700 }}>
            <UserPlus size={20} color="var(--primary)" /> New Registration
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. John Doe"
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Academic Branch</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Computer Science"
                required
                value={formData.branch}
                onChange={e => setFormData({...formData, branch: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Face Identification Photo</label>
              <div style={{ 
                border: '2px dashed var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem',
                textAlign: 'center', background: '#f8fafc', transition: 'all 0.2s'
              }}>
                <input 
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={e => setFiles(Array.from(e.target.files))}
                  style={{ display: 'none' }}
                  id="face-upload"
                />
                <label htmlFor="face-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <UserPlus size={24} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {files.length > 0 ? `${files.length} photos selected` : "Select one or more clear face photos"}
                  </span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn" style={{ width: '100%', padding: '0.75rem', display: 'flex', gap: '0.5rem' }} disabled={loading}>
              <UserPlus size={18} /> {loading ? "Analyzing..." : "Complete Enrollment"}
            </button>
          </form>
        </div>

        <div className="glass-panel">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Active Student Records</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
              <thead>
                <tr>
                  <th style={{ borderRadius: '0.5rem 0 0 0.5rem' }}>Reference ID</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'center', borderRadius: '0 0.5rem 0.5rem 0' }}>Management</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id} style={{ background: '#fff' }}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>#{String(student.id).padStart(4, '0')}</td>
                    <td style={{ fontWeight: 600 }}>{student.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{student.branch}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => deleteStudent(student.id)}
                        className="btn-danger"
                        style={{ border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No students enrolled in the system database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
