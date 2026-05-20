const { Task, ProjectMember, User } = require('../models');

exports.createTask = async (req, res) => {
  try {
    const { projectId, title, description, status, priority, dueDate, assignedToId } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Task title and Project ID are required' });
    }

    // Verify target assignee is a member of the project
    if (assignedToId) {
      const membership = await ProjectMember.findOne({
        where: { projectId, userId: assignedToId }
      });
      if (!membership) {
        return res.status(400).json({ message: 'Assigned user is not a member of this project' });
      }
    }

    const task = await Task.create({
      projectId,
      title,
      description,
      status: status || 'To Do',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      assignedToId: assignedToId || null
    });

    // Fetch the task again to include the assignee object
    const createdTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'avatarUrl'] }
      ]
    });

    return res.status(201).json({
      message: 'Task created successfully',
      task: createdTask
    });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ message: 'Error creating task' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, dueDate, assignedToId } = req.body;

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Role check: If not Admin, can ONLY update the status field
    const userRole = req.projectRole; // set by checkProjectRole middleware
    if (userRole !== 'Admin') {
      const bodyKeys = Object.keys(req.body);
      const invalidUpdates = bodyKeys.filter(k => !['status', 'projectId'].includes(k));
      if (invalidUpdates.length > 0) {
        return res.status(403).json({ 
          message: 'Access denied: Members can only update the status of tasks. All other edits require Admin permissions.' 
        });
      }
    }

    // If updating assignee, verify they are in this project
    if (assignedToId && assignedToId !== task.assignedToId) {
      const membership = await ProjectMember.findOne({
        where: { projectId: task.projectId, userId: assignedToId }
      });
      if (!membership) {
        return res.status(400).json({ message: 'Assigned user is not a member of this project' });
      }
    }

    // Update allowable fields based on roles
    if (userRole === 'Admin') {
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority !== undefined) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
      if (assignedToId !== undefined) task.assignedToId = assignedToId || null;
    }
    
    // Both Admin and Member can update status
    if (status !== undefined) {
      if (!['To Do', 'In Progress', 'In Review', 'Done'].includes(status)) {
        return res.status(400).json({ message: 'Invalid task status' });
      }
      task.status = status;
    }

    await task.save();

    // Fetch refreshed task
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'avatarUrl'] }
      ]
    });

    return res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ message: 'Error updating task' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.destroy();

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ message: 'Error deleting task' });
  }
};
