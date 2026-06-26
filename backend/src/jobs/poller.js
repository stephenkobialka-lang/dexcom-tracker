const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const dexcomService = require('../services/dexcom');
const { checkAndCreateAlerts } = require('../services/alerts');

const prisma = new PrismaClient();

/**
 * Fetch and store the latest readings for all authenticated users
 */
async function pollAllUsers() {
  console.log(`[Poller] Running at ${new Date().toISOString()}`);

  const users = await prisma.user.findMany({
    where: {
      accessToken: { not: null },
      tokenExpiresAt: { gt: new Date() },
    },
  });

  if (users.length === 0) {
    console.log('[Poller] No authenticated users found.');
    return;
  }

  for (const user of users) {
    try {
      await pollUser(user);
    } catch (err) {
      console.error(`[Poller] Error polling user ${user.id}:`, err.message);
    }
  }
}

async function pollUser(user) {
  // Try to refresh token if expiring within 10 minutes
  const expiresIn = user.tokenExpiresAt - new Date();
  if (expiresIn < 10 * 60 * 1000) {
    console.log(`[Poller] Refreshing token for user ${user.id}`);
    try {
      const tokens = await dexcomService.refreshAccessToken(user.refreshToken);
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      });
} catch (err) {
      console.error(`[Poller] Error polling user ${user.id}:`, err.message);
      if (err.response) {
        console.error('[Poller] Response status:', err.response.status);
        console.error('[Poller] Response data:', JSON.stringify(err.response.data));
      }
    }

  // Fetch last 3 hours of readings (overlap ensures no gaps)
  const endDate = new Date();
  const startDate = new Date(endDate - 3 * 60 * 60 * 1000);

console.log('[Poller] Fetching readings for user', user.id);
const rawReadings = await dexcomService.fetchGlucoseReadings(
    user.accessToken,
    startDate,
    endDate
  );

  if (!rawReadings.length) {
    console.log(`[Poller] No new readings for user ${user.id}`);
    return;
  }

  // Upsert readings (skip duplicates by systemTime)
  let newCount = 0;
  for (const raw of rawReadings) {
    const mapped = dexcomService.mapReading(raw);
    const result = await prisma.glucoseReading.upsert({
      where: {
        userId_systemTime: {
          userId: user.id,
          systemTime: mapped.systemTime,
        },
      },
      update: {},
      create: { userId: user.id, ...mapped },
    });
    if (result) newCount++;
  }

  console.log(`[Poller] Stored readings for user ${user.id}`);

  // Get latest reading and check for alerts
  const latestReading = await prisma.glucoseReading.findFirst({
    where: { userId: user.id },
    orderBy: { systemTime: 'desc' },
  });

  if (latestReading) {
    await checkAndCreateAlerts(user.id, latestReading);
  }
}

/**
 * Start the cron job — every 5 minutes
 */
function startPollingJob() {
  console.log('[Poller] Starting background polling job (every 5 minutes)');

  // Run immediately on startup
  pollAllUsers();

  // Then every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    pollAllUsers();
  });
}

module.exports = { startPollingJob, pollAllUsers };
