const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  status: {
    type: DataTypes.ENUM('To Do', 'In Progress', 'In Review', 'Done'),
    allowNull: false,
    defaultValue: 'To Do'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    allowNull: false,
    defaultValue: 'Medium'
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
});

module.exports = Task;
