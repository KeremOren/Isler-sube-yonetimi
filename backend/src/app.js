const express = require('express');
const cors = require('cors');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/auth');
const branchRoutes = require('./routes/branches');
const analyticsRoutes = require('./routes/analytics');
const mapRoutes = require('./routes/map');
const exportRoutes = require('./routes/export');
const decisionRoutes = require('./routes/decisions');
const scenarioRoutes = require('./routes/scenarios');
const forecastRoutes = require('./routes/forecast');
const userRoutes = require('./routes/users');

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (config.nodeEnv === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/branches', branchRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/map', mapRoutes);
app.use('/export', exportRoutes);
app.use('/decisions', decisionRoutes);
app.use('/scenarios', scenarioRoutes);
app.use('/forecast', forecastRoutes);
app.use('/users', userRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: config.nodeEnv === 'development' ? err.message : 'Internal server error'
    });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
});

module.exports = app;
