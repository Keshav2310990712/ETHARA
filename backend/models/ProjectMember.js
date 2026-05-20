const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectMember = sequelize.define('ProjectMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Member'),
    allowNull: false,
    defaultValue: 'Member'
  }
});

module.exports = ProjectMember;
