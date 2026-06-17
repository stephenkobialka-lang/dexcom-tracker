require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const readingsRoutes = require('./routes/readings');
const analysisRoutes = require('./routes/analysis');
const alertsRoutes = require('./routes/alerts');
const { startPollingJob } = require('./jobs/poller');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(express.json());

// CORS — allow your GitHub Pages frontend
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000', // local dev
  ],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use('/api/', limiter);

// Routes
app.use('/auth', authRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/alerts', alertsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // Start the background polling job
  startPollingJob();
});
