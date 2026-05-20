const { ProjectMember } = require('../models');

/**
 * Middleware to check project membership and role.
 * @param {Array<string>} allowedRoles - Roles allowed (e.g., ['Admin'] or ['Admin', 'Member'])
 */
const checkProjectRole = (allowedRoles = ['Admin', 'Member']) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
      
      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required for this action' });
      }

      const membership = await ProjectMember.findOne({
        where: {
          projectId,
          userId: req.user.id
        }
      });

      if (!membership) {
        return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
      }

      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({ 
          message: `Access denied: Requires one of these roles: ${allowedRoles.join(', ')}. Your role is: ${membership.role}` 
        });
      }

      req.projectRole = membership.role;
      req.projectMember = membership;
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({ message: 'Internal server error checking roles' });
    }
  };
};

module.exports = {
  checkProjectRole
};
