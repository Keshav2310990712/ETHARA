const User = require('./User');
const Project = require('./Project');
const ProjectMember = require('./ProjectMember');
const Task = require('./Task');
const sequelize = require('../config/database');

// User <-> Project Ownership
User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects', onDelete: 'SET NULL' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// Project <-> User Members (Many-to-Many through ProjectMember)
User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'userId' });
Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'projectId', as: 'members' });

// Associations on ProjectMember itself for easier queries
Project.hasMany(ProjectMember, { foreignKey: 'projectId', onDelete: 'CASCADE' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId' });

User.hasMany(ProjectMember, { foreignKey: 'userId', onDelete: 'CASCADE' });
ProjectMember.belongsTo(User, { foreignKey: 'userId' });

// Project <-> Task
Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId' });

// User <-> Task Assignment
User.hasMany(Task, { foreignKey: 'assignedToId', as: 'tasks', onDelete: 'SET NULL' });
Task.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignee' });

module.exports = {
  sequelize,
  User,
  Project,
  ProjectMember,
  Task
};
