import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectBoard from './components/ProjectBoard';
import { api } from './api';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState('dashboard');
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeProject, setActiveProject] = useState(null);

  // Auto-redirect if not logged in
  useEffect(() => {
    if (!user) {
      setView('login');
      setActiveProjectId(null);
      setActiveProject(null);
    } else if (view === 'login') {
      setView('dashboard');
    }
  }, [user, view]);

  const handleSelectProject = async (projectId) => {
    setActiveProjectId(projectId);
    try {
      // Quick fetch project name for sidebar indicator
      const proj = await api.get(`/projects/${projectId}`);
      setActiveProject({ id: proj.id, name: proj.name });
    } catch (err) {
      console.error('Error selecting project:', err);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'white',
        gap: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--border-glass-bright)',
          borderTop: '4px solid var(--primary-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: '500', letterSpacing: '0.05em' }}>
          VERIFYING SECURITY TOKENS...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="app-container">
      <div className="app-glow-bg"></div>
      
      <Sidebar 
        currentView={view} 
        setView={setView} 
        activeProject={activeProject}
        clearActiveProject={() => {
          setActiveProjectId(null);
          setActiveProject(null);
        }}
      />

      <main className="main-content">
        {view === 'dashboard' && (
          <Dashboard 
            onSelectProject={handleSelectProject} 
            setView={setView} 
          />
        )}
        
        {view === 'projects' && (
          <ProjectList 
            onSelectProject={handleSelectProject} 
            setView={setView} 
          />
        )}
        
        {view === 'board' && activeProjectId && (
          <ProjectBoard 
            projectId={activeProjectId} 
            setView={setView} 
          />
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
