import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        login(data.access_token);
        navigate('/');
      } else {
        setError(data.detail || "Login failed");
      }
    } catch (err) {
      setError("Network error. Is the backend running?");
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', background: 'var(--bg-color)', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '3.5rem 3rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '1.25rem', background: '#eff6ff', borderRadius: '1rem', marginBottom: '2rem' }}>
          <Lock size={32} color="var(--primary)" />
        </div>
        <h2 style={{ marginBottom: '0.75rem', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>Faculty Portal</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>Secure access to student attendance systems</p>
        
        {error && <div style={{ background: '#fef2f2', color: 'var(--error)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid #fee2e2' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label style={{ fontWeight: 600, color: 'var(--text-main)' }}>Admin Username</label>
            <input 
              type="text" 
              className="form-input" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required 
            />
          </div>
          <div className="form-group" style={{ marginBottom: '2.5rem' }}>
            <label style={{ fontWeight: 600, color: 'var(--text-main)' }}>Security Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" className="btn" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}>
            Sign In to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
