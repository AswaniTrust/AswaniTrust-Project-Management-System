require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getPool } = require('./config/database');

const authRoutes = require('./routes/auth');
const companiesRoutes = require('./routes/companies');
const projectsRoutes = require('./routes/projects');
const tasksRoutes = require('./routes/tasks');
const bugsRoutes = require('./routes/bugs');
const teamRoutes = require('./routes/team');
const timesheetsRoutes = require('./routes/timesheets');
const uploadsRoutes = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/bugs', bugsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/timesheets', timesheetsRoutes);
app.use('/api/uploads', uploadsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const startServer = async () => {
  try {
    await getPool();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
