import React from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ currentView, setView, activeProject, clearActiveProject }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="sidebar">
      <div className="sidebar-logo" onClick={() => { setView('dashboard'); clearActiveProject(); }} style={{ cursor: 'pointer' }}>
        <span>▲ ETHARA</span>
      </div>

      <ul className="sidebar-menu">
        <li 
          className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setView('dashboard'); clearActiveProject(); }}
        >
          {/* Dashboard Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          Dashboard
        </li>

        <li 
          className={`sidebar-item ${currentView === 'projects' ? 'active' : ''}`}
          onClick={() => { setView('projects'); clearActiveProject(); }}
        >
          {/* Projects Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Projects
        </li>

        {activeProject && (
          <li 
            className={`sidebar-item ${currentView === 'board' ? 'active' : ''}`}
            onClick={() => setView('board')}
            style={{ 
              marginTop: '10px', 
              borderLeft: currentView === 'board' ? '3px solid var(--secondary-color)' : '1px dashed var(--border-glass-bright)',
              background: currentView === 'board' ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
              color: currentView === 'board' ? 'var(--secondary-color)' : 'var(--text-primary)'
            }}
          >
            {/* Active Project Board Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
              <path d="M15 3v18" />
            </svg>
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              maxWidth: '150px'
            }}>
              📋 {activeProject.name}
            </span>
          </li>
        )}
      </ul>

      <div className="sidebar-user">
        <img 
          src={user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.name}`} 
          alt="Avatar" 
          className="user-avatar" 
        />
        <div className="user-info">
          <span className="user-name">{user.name}</span>
          <span className="user-role">{user.email}</span>
        </div>
        <button 
          onClick={logout} 
          className="logout-btn" 
          title="Sign Out"
        >
          {/* Logout Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
