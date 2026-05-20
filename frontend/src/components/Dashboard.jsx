import React, { useEffect, useState } from 'react';
import { api } from '../api';

const Dashboard = ({ onSelectProject, setView }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [personalView, setPersonalView] = useState(true); // Toggle between assigned to me vs overall team

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.get('/dashboard/stats');
      setStats(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Gathering real-time workspace metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--priority-high)', marginBottom: '20px' }}>{error || 'Error loading dashboard'}</p>
        <button onClick={fetchStats} className="btn btn-secondary">Retry Load</button>
      </div>
    );
  }

  const totalTasks = personalView ? stats.tasksSummary.myTasks : stats.tasksSummary.totalTasks;
  const completedTasks = personalView ? stats.tasksSummary.myCompletedTasks : stats.tasksSummary.completedTasks;
  const pendingTasks = totalTasks - completedTasks;
  const overdueCount = personalView ? stats.myOverdueCount : stats.overdueCount;

  return (
    <div>
      <div className="view-header">
        <div>
          <h2>Workspace Dashboard</h2>
          <p>Real-time pipeline analytics & project tracking metrics</p>
        </div>
        
        {/* Toggle between Personal & Team Stats */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-glass-bright)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px',
          display: 'flex',
          gap: '4px'
        }}>
          <button
            className={`btn ${personalView ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '4px' }}
            onClick={() => setPersonalView(true)}
          >
            My Assignments
          </button>
          <button
            className={`btn ${!personalView ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '4px' }}
            onClick={() => setPersonalView(false)}
          >
            Team Operations
          </button>
        </div>
      </div>

      {/* Overdue Alert Banner */}
      {overdueCount > 0 && (
        <div className="alert-banner">
          <div className="alert-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="alert-message">
            Attention: You have <strong>{overdueCount} overdue task{overdueCount > 1 ? 's' : ''}</strong> {personalView ? 'assigned to you' : 'in your active projects'}. Please review the due dates to ensure timely delivery.
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        {/* Card 1: Projects */}
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.projectsCount}</span>
            <span className="stat-label">Active Projects</span>
          </div>
        </div>

        {/* Card 2: Total Assigned/Team Tasks */}
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalTasks}</span>
            <span className="stat-label">{personalView ? 'My Total Tasks' : 'Total Project Tasks'}</span>
          </div>
        </div>

        {/* Card 3: Pending/In Progress Tasks */}
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fde047' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{pendingTasks}</span>
            <span className="stat-label">Pending / In-Flight</span>
          </div>
        </div>

        {/* Card 4: Completed Tasks */}
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{completedTasks}</span>
            <span className="stat-label">Tasks Completed</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginTop: '30px' }}>
        {/* Left Side: Recent & Upcoming Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Upcoming tasks milestones */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--secondary-color)' }}>📅</span> Upcoming Due Dates
            </h3>
            {stats.upcomingTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '10px 0' }}>No upcoming task milestones found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.upcomingTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="task-card"
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      padding: '12px 16px'
                    }}
                    onClick={() => {
                      onSelectProject(task.projectId);
                      setView('board');
                    }}
                  >
                    <div>
                      <span className="task-title" style={{ margin: 0, fontSize: '0.9rem' }}>{task.title}</span>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                        <span className={`priority-badge priority-${task.priority.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                          {task.priority}
                        </span>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          background: `rgba(${task.status === 'In Progress' ? '59,130,246' : task.status === 'In Review' ? '139,92,246' : '71,85,105'}, 0.15)`,
                          color: task.status === 'In Progress' ? '#93c5fd' : task.status === 'In Review' ? '#c084fc' : 'var(--text-secondary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        📅 {task.dueDate}
                      </span>
                      {task.assignee && (
                        <img 
                          src={task.assignee.avatarUrl} 
                          alt={task.assignee.name}
                          className="assignee-avatar" 
                          title={`Assigned to ${task.assignee.name}`}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent active tasks */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--primary-color)' }}>⚡</span> Recent Task Activity
            </h3>
            {stats.recentTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '10px 0' }}>No recent task activity recorded.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.recentTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="task-card"
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      padding: '12px 16px'
                    }}
                    onClick={() => {
                      onSelectProject(task.projectId);
                      setView('board');
                    }}
                  >
                    <div>
                      <span className="task-title" style={{ margin: 0, fontSize: '0.9rem' }}>{task.title}</span>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                        <span className={`priority-badge priority-${task.priority.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                          {task.priority}
                        </span>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          background: `rgba(${task.status === 'Done' ? '16,185,129' : task.status === 'In Progress' ? '59,130,246' : '71,85,105'}, 0.15)`,
                          color: task.status === 'Done' ? '#6ee7b7' : task.status === 'In Progress' ? '#93c5fd' : 'var(--text-secondary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {task.dueDate && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Due {task.dueDate}
                        </span>
                      )}
                      {task.assignee && (
                        <img 
                          src={task.assignee.avatarUrl} 
                          alt={task.assignee.name}
                          className="assignee-avatar" 
                          title={`Assigned to ${task.assignee.name}`}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Projects Progress list */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#d8b4fe' }}>📈</span> Project Progress
          </h3>
          {stats.projectsProgress.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active projects. Click &quot;Projects&quot; to create one.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {stats.projectsProgress.map(project => (
                <div 
                  key={project.id}
                  style={{ cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'var(--transition-smooth)' }}
                  onClick={() => {
                    onSelectProject(project.id);
                    setView('board');
                  }}
                  className="project-progress-item"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: '600' }}>📁 {project.name}</span>
                    <span style={{ color: 'var(--secondary-color)', fontWeight: '700' }}>{project.progress}%</span>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${project.progress}%`,
                        background: project.progress === 100 
                          ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' 
                          : 'var(--primary-glow)' 
                      }}
                    ></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    <span>{project.completedTasks} Done</span>
                    <span>{project.totalTasks} Tasks total</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
