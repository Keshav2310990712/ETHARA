const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkProjectRole } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:projectId', projectController.getProjectDetails);
router.delete('/:projectId', checkProjectRole(['Admin']), projectController.deleteProject);

// Members management routes (requires Admin role in project)
router.post('/:projectId/members', checkProjectRole(['Admin']), projectController.addMember);
router.put('/:projectId/members/:userId', checkProjectRole(['Admin']), projectController.updateMemberRole);
router.delete('/:projectId/members/:userId', checkProjectRole(['Admin']), projectController.removeMember);

module.exports = router;
