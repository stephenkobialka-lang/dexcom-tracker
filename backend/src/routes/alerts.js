const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/alerts?userId=xxx&unacknowledgedOnly=true
router.get('/', async (req, res) => {
  const { userId, unacknowledgedOnly = 'false', limit = 20 } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const alerts = await prisma.alert.findMany({
      where: {
        userId,
        ...(unacknowledgedOnly === 'true' && { acknowledged: false }),
      },
      orderBy: { triggeredAt: 'desc' },
      take: parseInt(limit),
    });
    res.json({ alerts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// PATCH /api/alerts/:id/acknowledge
router.patch('/:id/acknowledge', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data: { acknowledged: true },
    });

    if (alert.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ alert });
  } catch (err) {
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// PATCH /api/alerts/acknowledge-all
router.patch('/acknowledge-all', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    await prisma.alert.updateMany({
      where: { userId, acknowledged: false },
      data: { acknowledged: true },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to acknowledge alerts' });
  }
});

module.exports = router;
