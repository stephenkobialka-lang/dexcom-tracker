const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const HIGH_THRESHOLD = parseInt(process.env.ALERT_HIGH_THRESHOLD) || 180;
const LOW_THRESHOLD = parseInt(process.env.ALERT_LOW_THRESHOLD) || 70;
const RAPID_RISE_RATE = parseFloat(process.env.ALERT_RAPID_RISE_RATE) || 2.0;
const RAPID_FALL_RATE = parseFloat(process.env.ALERT_RAPID_FALL_RATE) || -2.0;

// Cooldown: don't re-alert for same type within 30 minutes
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;

async function checkAndCreateAlerts(userId, reading) {
  const alerts = [];

  // HIGH glucose
  if (reading.value > HIGH_THRESHOLD) {
    const recent = await getRecentAlert(userId, 'HIGH');
    if (!recent) {
      alerts.push({
        type: 'HIGH',
        value: reading.value,
        threshold: HIGH_THRESHOLD,
        message: `Glucose is HIGH at ${reading.value} mg/dL (threshold: ${HIGH_THRESHOLD})`,
      });
    }
  }

  // LOW glucose
  if (reading.value < LOW_THRESHOLD) {
    const recent = await getRecentAlert(userId, 'LOW');
    if (!recent) {
      alerts.push({
        type: 'LOW',
        value: reading.value,
        threshold: LOW_THRESHOLD,
        message: `Glucose is LOW at ${reading.value} mg/dL (threshold: ${LOW_THRESHOLD})`,
      });
    }
  }

  // RAPID RISE
  if (reading.trendRate && reading.trendRate >= RAPID_RISE_RATE) {
    const recent = await getRecentAlert(userId, 'RAPID_RISE');
    if (!recent) {
      alerts.push({
        type: 'RAPID_RISE',
        value: reading.value,
        threshold: RAPID_RISE_RATE,
        message: `Glucose rising rapidly at ${reading.trendRate.toFixed(1)} mg/dL/min — currently ${reading.value} mg/dL`,
      });
    }
  }

  // RAPID FALL
  if (reading.trendRate && reading.trendRate <= RAPID_FALL_RATE) {
    const recent = await getRecentAlert(userId, 'RAPID_FALL');
    if (!recent) {
      alerts.push({
        type: 'RAPID_FALL',
        value: reading.value,
        threshold: RAPID_FALL_RATE,
        message: `Glucose falling rapidly at ${reading.trendRate.toFixed(1)} mg/dL/min — currently ${reading.value} mg/dL`,
      });
    }
  }

  if (alerts.length > 0) {
    await prisma.alert.createMany({
      data: alerts.map(a => ({ userId, ...a })),
    });
    console.log(`[Alerts] Created ${alerts.length} alert(s) for user ${userId}`);
  }
}

async function getRecentAlert(userId, type) {
  return prisma.alert.findFirst({
    where: {
      userId,
      type,
      triggeredAt: { gt: new Date(Date.now() - ALERT_COOLDOWN_MS) },
    },
    orderBy: { triggeredAt: 'desc' },
  });
}

module.exports = { checkAndCreateAlerts };
