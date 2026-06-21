import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, LogOut, GraduationCap, Camera as CameraIcon } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Students from './pages/Students';
import Reports from './pages/Reports';
import Login from './pages/Login';
import LiveCamera from './pages/LiveCamera';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AdminLayout({ children }) {
  const { logout } = useAuth();
  
  return (
    <div className="app-container">
      <aside className="sidebar">
        <h1>
          <GraduationCap size={28} style={{ verticalAlign: 'middle', marginRight: '0.75rem' }} />
          Portal
        </h1>
        
        <div style={{ flex: 1 }}>
          <NavLink to="/" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          
          <NavLink to="/students" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={18} /> Students
          </NavLink>
          
          <NavLink to="/reports" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <FileText size={18} /> Reports
          </NavLink>
          
          <NavLink to="/terminal" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <CameraIcon size={18} /> Attendance Terminal
          </NavLink>
        </div>

        <button onClick={logout} className="sidebar-link" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--error)', marginTop: 'auto' }}>
          <LogOut size={18} /> Sign Out
        </button>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/terminal" element={<LiveCamera />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout><AnalyticsDashboard /></AdminLayout></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><AdminLayout><Students /></AdminLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><AdminLayout><Reports /></AdminLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
