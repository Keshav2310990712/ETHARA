import React, { useEffect, useState } from 'react';
import { api } from '../api';

const ProjectBoard = ({ projectId, setView }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Task Modals States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Form Fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStatus, setTaskStatus] = useState('To Do');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState(null);


  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/projects/${projectId}`);
      setProject(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  // Task CRUD operations
  const handleOpenCreateModal = (initialStatus = 'To Do') => {
    setModalMode('create');
    setSelectedTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskStatus(initialStatus);
    setTaskPriority('Medium');
    setTaskDueDate('');
    setTaskAssigneeId('');
    setShowTaskModal(true);
  };

  const handleOpenEditModal = (task) => {
    setModalMode('edit');
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskDueDate(task.dueDate || '');
    setTaskAssigneeId(task.assignedToId || '');
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !projectId) return;

    const payload = {
      projectId,
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      status: taskStatus,
      priority: taskPriority,
      dueDate: taskDueDate || null,
      assignedToId: taskAssigneeId || null
    };

    try {
      setTaskSubmitting(true);
      if (modalMode === 'create') {
        await api.post('/tasks', payload);
      } else if (modalMode === 'edit' && selectedTask) {
        await api.put(`/tasks/${selectedTask.id}`, payload);
      }
      setShowTaskModal(false);
      fetchProjectDetails();
    } catch (err) {
      alert(err.message || 'Error processing task');
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId, title) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the task "${title}"?`);
    if (!confirmDelete) return;

    try {
      await api.delete(`/tasks/${taskId}`);
      fetchProjectDetails();
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  // Status rapid modifications (supports drag-and-drop & dropdown selects)
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      // Optimistically update status in UI to feel instantaneous
      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
        };
      });

      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      alert(err.message || 'Failed to update task status');
      // Re-fetch project details if sync fails
      fetchProjectDetails();
    }
  };

  // HTML5 Drag and Drop events
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Required to allow drop
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      const task = project.tasks.find(t => t.id === taskId);
      if (task && task.status !== targetStatus) {
        handleUpdateStatus(taskId, targetStatus);
      }
    }
    setDraggedTaskId(null);
  };

  if (loading && !project) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Opening Project Board...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--priority-high)', marginBottom: '20px' }}>{error || 'Project not found'}</p>
        <button onClick={() => setView('projects')} className="btn btn-secondary">Back to Portfolio</button>
      </div>
    );
  }

  const isAdmin = project.myRole === 'Admin';
  const today = new Date().toISOString().slice(0, 10);

  // Filters application
  const filteredTasks = project.tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;

    let matchesAssignee = true;
    if (assigneeFilter !== 'All') {
      if (assigneeFilter === 'Unassigned') {
        matchesAssignee = !task.assignedToId;
      } else {
        matchesAssignee = task.assignedToId === assigneeFilter;
      }
    }

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const columns = [
    { title: 'To Do', color: 'var(--status-todo)' },
    { title: 'In Progress', color: 'var(--status-inprogress)' },
    { title: 'In Review', color: 'var(--status-inreview)' },
    { title: 'Done', color: 'var(--status-done)' }
  ];

  return (
    <div>
      {/* Board Header */}
      <div className="view-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => setView('projects')} 
              className="btn btn-secondary" 
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
            >
              ← Back
            </button>
            <h2 style={{ fontSize: '1.6rem', margin: 0 }}>{project.name}</h2>
            <span className={`project-role-badge role-${project.myRole.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
              {project.myRole}
            </span>
          </div>
          <p style={{ marginTop: '6px' }}>{project.description || 'No description provided.'}</p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={() => handleOpenCreateModal('To Do')}>
            <span>＋</span> Create Task
          </button>
        )}
      </div>

      {/* Filters Dashboard Toolbar */}
      <div className="glass-card" style={{
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '15px',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: '200px' }}>
          <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>Search Tasks</span>
          <input
            type="text"
            className="form-input"
            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
            placeholder="Type search queries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '130px' }}>
          <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>Priority</span>
          <select
            className="member-select-role"
            style={{ padding: '8px 12px', background: 'var(--bg-tertiary)' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '180px' }}>
          <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>Assignee</span>
          <select
            className="member-select-role"
            style={{ padding: '8px 12px', background: 'var(--bg-tertiary)' }}
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="All">All Members</option>
            <option value="Unassigned">Unassigned</option>
            {project.members && project.members.map(member => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      <div className="board-container">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.title);
          
          return (
            <div 
              key={col.title} 
              className="board-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.title)}
            >
              <div className="board-column-header">
                <div className="board-column-title">
                  <span className="column-indicator" style={{ background: col.color }}></span>
                  <span>{col.title}</span>
                </div>
                <span className="column-count">{colTasks.length}</span>
              </div>

              <div className="board-cards-list">
                {colTasks.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '30px 10px',
                    border: '1px dashed rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem'
                  }}>
                    No tasks here
                  </div>
                ) : (
                  colTasks.map(task => {
                    const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'Done';
                    
                    return (
                      <div 
                        key={task.id} 
                        className="task-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                      >
                        <div className="task-card-header">
                          <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                          
                          {/* Admin tools */}
                          {isAdmin && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button 
                                onClick={() => handleOpenEditModal(task)} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                                title="Edit Task"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => handleDeleteTask(task.id, task.title)} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                                title="Delete Task"
                              >
                                ❌
                              </button>
                            </div>
                          )}
                        </div>

                        <h4 className="task-title">{task.title}</h4>
                        {task.description && <p className="task-desc">{task.description}</p>}

                        <div className="task-footer">
                          {/* Overdue alert indicator */}
                          {task.dueDate ? (
                            <span className={`task-due ${isOverdue ? 'overdue' : ''}`} title={isOverdue ? 'Overdue!' : 'Due date'}>
                              📅 {task.dueDate}
                            </span>
                          ) : (
                            <span></span>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Member role status changer */}
                            <select
                              className="member-select-role"
                              style={{ 
                                padding: '2px 4px', 
                                fontSize: '0.7rem', 
                                border: 'none', 
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '3px'
                              }}
                              value={task.status}
                              onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="In Review">In Review</option>
                              <option value="Done">Done</option>
                            </select>

                            {task.assignee ? (
                              <img 
                                src={task.assignee.avatarUrl} 
                                alt={task.assignee.name} 
                                className="assignee-avatar"
                                title={`Assigned to ${task.assignee.name}`}
                              />
                            ) : (
                              <span 
                                className="assignee-avatar" 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  fontSize: '0.65rem', 
                                  color: 'var(--text-muted)',
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px dashed var(--border-glass)'
                                }}
                                title="Unassigned"
                              >
                                👤
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Column quick add (Admin only) */}
              {isAdmin && (
                <button 
                  onClick={() => handleOpenCreateModal(col.title)}
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '6px', fontSize: '0.8rem', borderStyle: 'dashed', marginTop: '6px' }}
                >
                  ＋ Add Task
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* --- TASK CREATION / EDITING MODAL (ADMIN ONLY) --- */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">{modalMode === 'create' ? 'Create Portfolio Task' : 'Edit Pipeline Task'}</h3>
              <button className="modal-close-btn" onClick={() => setShowTaskModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="task-title-input">Task Title</label>
                <input
                  id="task-title-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Set up auth pipelines"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-desc-input">Description</label>
                <textarea
                  id="task-desc-input"
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="Describe task scope and specs..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-priority-select">Priority</label>
                  <select
                    id="task-priority-select"
                    className="form-input"
                    style={{ background: 'var(--bg-primary)' }}
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="task-status-select">Status</label>
                  <select
                    id="task-status-select"
                    className="form-input"
                    style={{ background: 'var(--bg-primary)' }}
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-duedate-input">Due Date</label>
                  <input
                    id="task-duedate-input"
                    type="date"
                    className="form-input"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="task-assignee-select">Assign Member</label>
                  <select
                    id="task-assignee-select"
                    className="form-input"
                    style={{ background: 'var(--bg-primary)' }}
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {project.members && project.members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={taskSubmitting}
                >
                  {taskSubmitting ? 'Saving...' : modalMode === 'create' ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectBoard;
