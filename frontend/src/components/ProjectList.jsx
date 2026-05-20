import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const ProjectList = ({ onSelectProject, setView }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create Project Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Manage Team Modal States
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedProjDetails, setSelectedProjDetails] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  const { user } = useAuth();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await api.get('/projects');
      setProjects(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    try {
      setCreateSubmitting(true);
      await api.post('/projects', {
        name: newProjName.trim(),
        description: newProjDesc.trim()
      });
      setNewProjName('');
      setNewProjDesc('');
      setShowCreateModal(false);
      fetchProjects();
    } catch (err) {
      alert(err.message || 'Error creating project');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId, projName) => {
    const confirmDelete = window.confirm(`Are you absolutely sure you want to delete "${projName}"?\nThis will permanently delete all associated tasks.`);
    if (!confirmDelete) return;

    try {
      await api.delete(`/projects/${projectId}`);
      fetchProjects();
    } catch (err) {
      alert(err.message || 'Failed to delete project. Only the project owner can perform this action.');
    }
  };

  const openTeamManagement = async (project) => {
    setShowTeamModal(true);
    setSelectedProjDetails(project);
    setTeamLoading(true);
    setTeamError('');
    
    try {
      const data = await api.get(`/projects/${project.id}`);
      setSelectedProjDetails(data);
    } catch (err) {
      setTeamError('Failed to fetch detailed project members list');
    } finally {
      setTeamLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedProjDetails) return;

    try {
      setInviteSubmitting(true);
      setTeamError('');
      const data = await api.post(`/projects/${selectedProjDetails.id}/members`, {
        email: inviteEmail.trim(),
        role: inviteRole
      });
      
      // Update local members list state
      setSelectedProjDetails(prev => ({
        ...prev,
        members: [...prev.members, data.member]
      }));

      setInviteEmail('');
      setInviteRole('Member');
      // Refresh project list behind to sync member count
      fetchProjects();
    } catch (err) {
      setTeamError(err.message || 'Failed to add member to project');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRemoveMember = async (targetUserId) => {
    if (!selectedProjDetails) return;
    const confirmRemove = window.confirm('Are you sure you want to remove this member from the project?');
    if (!confirmRemove) return;

    try {
      setTeamError('');
      await api.delete(`/projects/${selectedProjDetails.id}/members/${targetUserId}`);
      
      // Update local members list state
      setSelectedProjDetails(prev => ({
        ...prev,
        members: prev.members.filter(m => m.id !== targetUserId)
      }));
      
      // Refresh projects list behind
      fetchProjects();
    } catch (err) {
      setTeamError(err.message || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    if (!selectedProjDetails) return;

    try {
      setTeamError('');
      await api.put(`/projects/${selectedProjDetails.id}/members/${targetUserId}`, {
        role: newRole
      });

      // Update local members list state
      setSelectedProjDetails(prev => ({
        ...prev,
        members: prev.members.map(m => m.id === targetUserId ? { ...m, role: newRole } : m)
      }));
    } catch (err) {
      setTeamError(err.message || 'Failed to update member role');
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading your projects portfolio...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <h2>Project Portfolio</h2>
          <p>Collaborate, delegate, and track team operations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <span>＋</span> Create Project
        </button>
      </div>

      {error && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '30px', marginBottom: '30px' }}>
          <p style={{ color: 'var(--priority-high)', marginBottom: '15px' }}>{error}</p>
          <button onClick={fetchProjects} className="btn btn-secondary">Retry</button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <h3 style={{ marginBottom: '12px' }}>Your Portfolio is Empty</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '25px', maxWidth: '400px', margin: '0 auto 25px' }}>
            Get started by creating your first project, setting up a Kanban board, and inviting your team members!
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            Create First Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project.id} className="glass-card project-card">
              <div className="project-card-header">
                <h3 className="project-title">{project.name}</h3>
                <span className={`project-role-badge role-${project.myRole.toLowerCase()}`}>
                  {project.myRole}
                </span>
              </div>
              
              <p className="project-desc">{project.description || 'No description provided.'}</p>
              
              <div className="project-progress-container">
                <div className="progress-header">
                  <span>Task Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${project.progress}%` }}></div>
                </div>
              </div>

              <div className="project-footer">
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div className="project-meta-item">
                    <span>👥</span> {project.membersCount} member{project.membersCount > 1 ? 's' : ''}
                  </div>
                  <div className="project-meta-item">
                    <span>📝</span> {project.tasksCount} task{project.tasksCount > 1 ? 's' : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      onSelectProject(project.id);
                      setView('board');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  >
                    View Board
                  </button>

                  {project.myRole === 'Admin' && (
                    <button 
                      onClick={() => openTeamManagement(project)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--secondary-color)' }}
                      title="Manage Team Members"
                    >
                      Team
                    </button>
                  )}

                  {/* Show delete only if user is project owner */}
                  {project.owner && project.owner.id === user.id && (
                    <button 
                      onClick={() => handleDeleteProject(project.id, project.name)}
                      className="btn btn-danger"
                      style={{ padding: '8px', fontSize: '0.8rem' }}
                      title="Delete Project Portfolio"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CREATE PROJECT MODAL --- */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Create New Project</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label" htmlFor="proj-name">Project Name</label>
                <input
                  id="proj-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Pipeline Sync"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="proj-desc">Description</label>
                <textarea
                  id="proj-desc"
                  className="form-input"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="Provide a brief description of the project goals..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={createSubmitting}
                >
                  {createSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MANAGE TEAM MODAL (ADMIN ONLY) --- */}
      {showTeamModal && selectedProjDetails && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Team Operations</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
                  Manage access control for <strong>{selectedProjDetails.name}</strong>
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowTeamModal(false)}>×</button>
            </div>

            {teamError && (
              <div style={{
                background: 'rgba(244,63,94,0.15)',
                color: 'white',
                border: '1px solid var(--priority-high)',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '15px',
                fontSize: '0.8rem'
              }}>
                {teamError}
              </div>
            )}

            {/* Invite Portal */}
            <form onSubmit={handleAddMember} style={{
              background: 'rgba(0,0,0,0.15)',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-glass)',
              marginBottom: '20px'
            }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '12px' }}>Invite Team Member</h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="email"
                  className="form-input"
                  style={{ flexGrow: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                  placeholder="collaborator@domain.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
                <select
                  className="member-select-role"
                  style={{ background: 'var(--bg-tertiary)' }}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  disabled={inviteSubmitting}
                >
                  {inviteSubmitting ? 'Adding...' : 'Invite'}
                </button>
              </div>
            </form>

            {/* Members Directory */}
            <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Project Directory</h4>
              {teamLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading directory...</p>
              ) : selectedProjDetails.members && selectedProjDetails.members.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No other members present in this project.</p>
              ) : (
                <div className="members-list">
                  {selectedProjDetails.members && selectedProjDetails.members.map(member => {
                    const isOwner = selectedProjDetails.owner && selectedProjDetails.owner.id === member.id;
                    const isMe = member.id === user.id;

                    return (
                      <div key={member.id} className="member-row">
                        <div className="member-user-info">
                          <img src={member.avatarUrl} alt={member.name} className="assignee-avatar" />
                          <div>
                            <span className="member-name">
                              {member.name} {isMe && <span style={{ color: 'var(--primary-color)', fontSize: '0.75rem' }}>(You)</span>}
                            </span>
                            <div className="member-email">
                              {member.email} {isOwner && <span style={{ color: 'var(--secondary-color)', fontSize: '0.7rem', fontWeight: '700' }}>(Owner)</span>}
                            </div>
                          </div>
                        </div>

                        <div className="member-actions-zone">
                          {isOwner || isMe ? (
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: '600', 
                              color: 'var(--text-muted)',
                              padding: '6px 12px'
                            }}>
                              {member.role}
                            </span>
                          ) : (
                            <>
                              <select
                                className="member-select-role"
                                value={member.role}
                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                              >
                                <option value="Member">Member</option>
                                <option value="Admin">Admin</option>
                              </select>
                              <button
                                type="button"
                                className="btn-danger btn"
                                style={{ padding: '6px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setShowTeamModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
