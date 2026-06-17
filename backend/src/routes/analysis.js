const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { runAnalysis } = require('../services/analysis');

const prisma = new PrismaClient();

// POST /api/analysis/run
// Trigger a new analysis
router.post('/run', async (req, res) => {
  const { userId, period = 'DAILY' } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const result = await runAnalysis(userId, period);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// GET /api/analysis/latest?userId=xxx&period=DAILY
// Get the most recent report
router.get('/latest', async (req, res) => {
  const { userId, period = 'DAILY' } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const report = await prisma.analysisReport.findFirst({
      where: { userId, period },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// GET /api/analysis/history?userId=xxx&period=WEEKLY&limit=10
router.get('/history', async (req, res) => {
  const { userId, period, limit = 10 } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const reports = await prisma.analysisReport.findMany({
      where: { userId, ...(period && { period }) },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
