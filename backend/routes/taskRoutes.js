const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkProjectRole } = require('../middleware/roleMiddleware');
const { Task } = require('../models');

router.use(authMiddleware);

// Middleware to inject projectId into req.params from taskId so role checks can run
const injectProjectIdFromTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    // Inject projectId so checkProjectRole can find it
    req.params.projectId = task.projectId;
    next();
  } catch (error) {
    console.error('Error injecting project ID:', error);
    return res.status(500).json({ message: 'Error identifying task project' });
  }
};

// Create a task (requires Admin role in project)
router.post('/', checkProjectRole(['Admin']), taskController.createTask);

// Update a task (requires Member or Admin role in project. Members can only update status)
router.put('/:taskId', injectProjectIdFromTask, checkProjectRole(['Admin', 'Member']), taskController.updateTask);

// Delete a task (requires Admin role in project)
router.delete('/:taskId', injectProjectIdFromTask, checkProjectRole(['Admin']), taskController.deleteTask);

module.exports = router;
