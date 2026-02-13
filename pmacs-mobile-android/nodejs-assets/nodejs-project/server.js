const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes (to be created)
const nurseChatRoute = require('./src/routes/nurse-chat');
const nurseDashboardRoute = require('./src/routes/nurse-dashboard');
const nurseAlertsRoute = require('./src/routes/nurse-alerts');
const pharmacistChatRoute = require('./src/routes/pharmacist-chat');
const adminDashboardRoute = require('./src/routes/admin-dashboard');
const loginRoute = require('./src/routes/login');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'P-MACS Mobile Backend Running' });
});

// API Routes
app.post('/api/nurse/chat', nurseChatRoute);
app.post('/api/nurse/dashboard', nurseDashboardRoute);
app.post('/api/nurse/alerts', nurseAlertsRoute);
app.post('/api/pharmacist/chat', pharmacistChatRoute);
app.post('/api/admin/dashboard', adminDashboardRoute);
app.post('/api/login', loginRoute);
app.post('/api/auth/login', loginRoute); // Alternative login endpoint

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    success: false,
  });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`P-MACS Mobile Backend running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /api/nurse/chat');
  console.log('  POST /api/nurse/dashboard');
  console.log('  POST /api/nurse/alerts');
  console.log('  POST /api/pharmacist/chat');
  console.log('  POST /api/admin/dashboard');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/login');
});

module.exports = app;
