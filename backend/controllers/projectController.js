const { Project, ProjectMember, User, Task } = require('../models');

exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    // Create the project
    const project = await Project.create({
      name,
      description,
      ownerId: req.user.id
    });

    // Add creator as Admin member
    await ProjectMember.create({
      projectId: project.id,
      userId: req.user.id,
      role: 'Admin'
    });

    return res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ message: 'Error creating project' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    // Find all project memberships for this user
    const memberships = await ProjectMember.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Project,
          include: [
            { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatarUrl'] },
            { model: ProjectMember, attributes: ['id'] },
            { model: Task, attributes: ['id', 'status'] }
          ]
        }
      ]
    });

    const projectsList = memberships.map(mem => {
      const proj = mem.Project;
      if (!proj) return null;

      const totalTasks = proj.Tasks.length;
      const completedTasks = proj.Tasks.filter(t => t.status === 'Done').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: proj.id,
        name: proj.name,
        description: proj.description,
        owner: proj.owner,
        myRole: mem.role,
        membersCount: proj.ProjectMembers.length,
        tasksCount: totalTasks,
        completedTasksCount: completedTasks,
        progress,
        createdAt: proj.createdAt
      };
    }).filter(Boolean);

    return res.status(200).json(projectsList);
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json({ message: 'Error retrieving projects' });
  }
};

exports.getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByPk(projectId, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatarUrl'] },
        {
          model: ProjectMember,
          include: [
            { model: User, attributes: ['id', 'name', 'email', 'avatarUrl'] }
          ]
        },
        {
          model: Task,
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'avatarUrl'] }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify requesting user is a member of this project
    const userMembership = await ProjectMember.findOne({
      where: { projectId, userId: req.user.id }
    });

    if (!userMembership) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
    }

    // Format members list cleanly
    const members = project.ProjectMembers.map(pm => ({
      membershipId: pm.id,
      id: pm.User.id,
      name: pm.User.name,
      email: pm.User.email,
      avatarUrl: pm.User.avatarUrl,
      role: pm.role,
      joinedAt: pm.createdAt
    }));

    return res.status(200).json({
      id: project.id,
      name: project.name,
      description: project.description,
      owner: project.owner,
      myRole: userMembership.role,
      members,
      tasks: project.Tasks,
      createdAt: project.createdAt
    });
  } catch (error) {
    console.error('Get project details error:', error);
    return res.status(500).json({ message: 'Error retrieving project details' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'User email is required' });
    }

    const assignedRole = role || 'Member';
    if (!['Admin', 'Member'].includes(assignedRole)) {
      return res.status(400).json({ message: 'Invalid role. Choose Admin or Member' });
    }

    // Find user by email
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(404).json({ message: `No user found with email: ${email}` });
    }

    // Check if user is already a member
    const existingMember = await ProjectMember.findOne({
      where: { projectId, userId: user.id }
    });

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    // Create membership
    const membership = await ProjectMember.create({
      projectId,
      userId: user.id,
      role: assignedRole
    });

    return res.status(201).json({
      message: 'Member added successfully',
      member: {
        membershipId: membership.id,
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: membership.role
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    return res.status(500).json({ message: 'Error adding member' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    // Check if target is project owner
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.ownerId === userId) {
      return res.status(400).json({ message: 'Cannot remove the project owner from the project' });
    }

    const membership = await ProjectMember.findOne({
      where: { projectId, userId }
    });

    if (!membership) {
      return res.status(404).json({ message: 'User is not a member of this project' });
    }

    await membership.destroy();

    return res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    return res.status(500).json({ message: 'Error removing member' });
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    if (!role || !['Admin', 'Member'].includes(role)) {
      return res.status(400).json({ message: 'Valid role (Admin or Member) is required' });
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.ownerId === userId) {
      return res.status(400).json({ message: 'Cannot change the role of the project owner' });
    }

    const membership = await ProjectMember.findOne({
      where: { projectId, userId }
    });

    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    membership.role = role;
    await membership.save();

    return res.status(200).json({
      message: 'Member role updated successfully',
      member: {
        userId,
        role: membership.role
      }
    });
  } catch (error) {
    console.error('Update member role error:', error);
    return res.status(500).json({ message: 'Error updating member role' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only actual owner can delete the project (or anyone with role Admin, but let's restrict to owner for absolute safety if needed, or Admin is fine. Let's allow Project Owner only for deletion to prevent rogue Admins deleting the whole project)
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: Only the project owner can delete this project' });
    }

    await project.destroy();

    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ message: 'Error deleting project' });
  }
};
