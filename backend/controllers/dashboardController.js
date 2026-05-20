const { Project, ProjectMember, Task, User } = require('../models');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format

    // 1. Get all project memberships for this user
    const memberships = await ProjectMember.findAll({
      where: { userId },
      attributes: ['projectId', 'role']
    });

    const projectIds = memberships.map(m => m.projectId);

    if (projectIds.length === 0) {
      return res.status(200).json({
        projectsCount: 0,
        tasksSummary: { totalTasks: 0, myTasks: 0, completedTasks: 0, myCompletedTasks: 0 },
        statusCounts: { 'To Do': 0, 'In Progress': 0, 'In Review': 0, 'Done': 0 },
        myStatusCounts: { 'To Do': 0, 'In Progress': 0, 'In Review': 0, 'Done': 0 },
        overdueCount: 0,
        myOverdueCount: 0,
        projectsProgress: [],
        recentTasks: [],
        upcomingTasks: []
      });
    }

    // 2. Fetch all projects with their tasks
    const projects = await Project.findAll({
      where: { id: { [Op.in]: projectIds } },
      include: [
        {
          model: Task,
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'avatarUrl'] }
          ]
        }
      ]
    });

    let totalTasksCount = 0;
    let myTasksCount = 0;
    let completedTasksCount = 0;
    let myCompletedTasksCount = 0;

    const statusCounts = { 'To Do': 0, 'In Progress': 0, 'In Review': 0, 'Done': 0 };
    const myStatusCounts = { 'To Do': 0, 'In Progress': 0, 'In Review': 0, 'Done': 0 };

    let overdueCount = 0;
    let myOverdueCount = 0;

    const projectsProgress = [];
    const allTasks = [];

    projects.forEach(project => {
      const tasks = project.Tasks || [];
      const projTotal = tasks.length;
      const projCompleted = tasks.filter(t => t.status === 'Done').length;
      const progress = projTotal > 0 ? Math.round((projCompleted / projTotal) * 100) : 0;

      projectsProgress.push({
        id: project.id,
        name: project.name,
        progress,
        totalTasks: projTotal,
        completedTasks: projCompleted
      });

      tasks.forEach(task => {
        allTasks.push(task);
        totalTasksCount++;
        
        // General stats
        statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
        
        const isOverdue = task.dueDate && task.dueDate < today && task.status !== 'Done';
        if (isOverdue) overdueCount++;

        if (task.status === 'Done') completedTasksCount++;

        // Assigned to me stats
        if (task.assignedToId === userId) {
          myTasksCount++;
          myStatusCounts[task.status] = (myStatusCounts[task.status] || 0) + 1;
          
          if (task.status === 'Done') myCompletedTasksCount++;
          if (isOverdue) myOverdueCount++;
        }
      });
    });

    // Sort and limit recent tasks
    const recentTasks = [...allTasks]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        projectId: t.projectId,
        assignee: t.assignee
      }));

    // Filter upcoming tasks
    const upcomingTasks = [...allTasks]
      .filter(t => t.dueDate && t.dueDate >= today && t.status !== 'Done')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        projectId: t.projectId,
        assignee: t.assignee
      }));

    return res.status(200).json({
      projectsCount: projects.length,
      tasksSummary: {
        totalTasks: totalTasksCount,
        myTasks: myTasksCount,
        completedTasks: completedTasksCount,
        myCompletedTasks: myCompletedTasksCount
      },
      statusCounts,
      myStatusCounts,
      overdueCount,
      myOverdueCount,
      projectsProgress,
      recentTasks,
      upcomingTasks
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ message: 'Error retrieving dashboard statistics' });
  }
};
