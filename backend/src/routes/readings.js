const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/readings/latest?userId=xxx
// Returns the most recent reading
router.get('/latest', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const reading = await prisma.glucoseReading.findFirst({
      where: { userId },
      orderBy: { systemTime: 'desc' },
    });

    if (!reading) return res.json({ reading: null });
    res.json({ reading });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch latest reading' });
  }
});

// GET /api/readings?userId=xxx&hours=24
// Returns readings for the last N hours (default 24)
router.get('/', async (req, res) => {
  const { userId, hours = 24 } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const hoursNum = Math.min(parseInt(hours) || 24, 168); // max 7 days
  const since = new Date(Date.now() - hoursNum * 60 * 60 * 1000);

  try {
    const readings = await prisma.glucoseReading.findMany({
      where: {
        userId,
        displayTime: { gte: since },
      },
      orderBy: { displayTime: 'asc' },
    });

    res.json({ readings, count: readings.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
});

module.exports = router;
