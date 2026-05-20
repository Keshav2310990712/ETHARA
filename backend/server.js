const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, User, Project, ProjectMember, Task } = require('./models');
require('dotenv').config();

// Environment validation
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is required!');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Database Seeding Helper
const seedDatabase = async () => {
  try {
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    console.log('Seeding database with sample project and users...');

    // 1. Create Users
    const admin = await User.create({
      name: 'Sarah Connor',
      email: 'admin@example.com',
      password: 'password123',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah Connor'
    });

    const member = await User.create({
      name: 'John Doe',
      email: 'member@example.com',
      password: 'password123',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=John Doe'
    });

    const observer = await User.create({
      name: 'Marcus Wright',
      email: 'marcus@example.com',
      password: 'password123',
      avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Marcus'
    });

    // 2. Create Project
    const project = await Project.create({
      name: 'Project Chronos',
      description: 'System deployment for temporal synchronizations and pipeline coordination.',
      ownerId: admin.id
    });

    // 3. Add Project Members
    await ProjectMember.create({
      projectId: project.id,
      userId: admin.id,
      role: 'Admin'
    });

    await ProjectMember.create({
      projectId: project.id,
      userId: member.id,
      role: 'Member'
    });

    await ProjectMember.create({
      projectId: project.id,
      userId: observer.id,
      role: 'Member'
    });

    // 4. Create Sample Tasks
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 2);
    const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);

    // Overdue Task
    await Task.create({
      projectId: project.id,
      title: 'Initialize Quantum Grid Node',
      description: 'Perform frequency scan and link up core node 01. Must be done before calibration.',
      status: 'In Progress',
      priority: 'High',
      dueDate: yesterday.toISOString().slice(0, 10),
      assignedToId: member.id
    });

    // To Do Task
    await Task.create({
      projectId: project.id,
      title: 'Configure Firewall Shields',
      description: 'Audit safety protocols and seal external network bridges.',
      status: 'To Do',
      priority: 'Medium',
      dueDate: nextWeek.toISOString().slice(0, 10),
      assignedToId: observer.id
    });

    // In Review Task
    await Task.create({
      projectId: project.id,
      title: 'Database Schema Verification',
      description: 'Review foreign key relationships and index structures for relational optimization.',
      status: 'In Review',
      priority: 'High',
      dueDate: tomorrow.toISOString().slice(0, 10),
      assignedToId: admin.id
    });

    // Completed Task
    await Task.create({
      projectId: project.id,
      title: 'Establish Secure Shell Tunnel',
      description: 'Configure standard key-based authorization for admin team access points.',
      status: 'Done',
      priority: 'Low',
      dueDate: yesterday.toISOString().slice(0, 10),
      assignedToId: admin.id
    });

    console.log('Database successfully seeded!');
    console.log('--------------------------------------------------');
    console.log('Test Accounts available:');
    console.log('Admin: admin@example.com (Password: password123)');
    console.log('Member: member@example.com (Password: password123)');
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
};

// Serve static assets in production
// if (process.env.NODE_ENV === 'production') {
//   const distPath = path.join(__dirname, '..', 'frontend', 'dist');
//   app.use(express.static(distPath));

//   app.get('*', (req, res) => {
//     // Exclude API paths
//     if (!req.path.startsWith('/api/')) {
//       res.sendFile(path.join(distPath, 'index.html'));
//     } else {
//       res.status(404).json({ message: 'API endpoint not found' });
//     }
//   });
// } else {
//   // Simple welcome route for local backend check
//   app.get('/', (req, res) => {
//     res.json({ message: 'Welcome to Ethara Project Manager API' });
//   });
// }

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Ethara Project Manager API' });
});

// Database sync & start server
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('Database connected and schemas synced.');
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
