const express = require('express');
const router = express.Router();
const dexcomService = require('../services/dexcom');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Step 1: Redirect user to Dexcom login
router.get('/login', (req, res) => {
  const authUrl = dexcomService.getAuthorizationUrl();
  res.redirect(authUrl);
});

// Step 2: Dexcom redirects back here with ?code=...
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${process.env.FRONTEND_URL}?auth=error`);
  }

  try {
    console.log('Attempting token exchange...');
    const tokens = await dexcomService.exchangeCodeForTokens(code);
    console.log('Token exchange successful');

    console.log('Attempting to get user info...');
    const dexcomUser = await dexcomService.getDexcomUser(tokens.access_token);
    console.log('Got user info:', dexcomUser);

    console.log('Attempting database upsert...');
    const user = await prisma.user.upsert({
      where: { dexcomUserId: dexcomUser.userId },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
      create: {
        id: require('crypto').randomUUID(),
        dexcomUserId: dexcomUser.userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

console.log('Upsert successful, redirecting with userId:', user.id);
    const frontendUrl = process.env.FRONTEND_URL;
    const userId = user.id;
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta http-equiv="refresh" content="0;url=${frontendUrl}?userId=${userId}&auth=success">
      </head>
      <body>Redirecting...</body>
      </html>
    `);
    
  } catch (err) {
    console.error('Auth callback error:', err.message);
    return res.redirect(`${process.env.FRONTEND_URL}#auth=error`);
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.refreshToken) return res.status(401).json({ error: 'No refresh token' });

    const tokens = await dexcomService.refreshAccessToken(user.refreshToken);

    await prisma.user.update({
      where: { id: userId },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Token refresh error:', err.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Check auth status
router.get('/status/:userId', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { id: true, tokenExpiresAt: true, dexcomUserId: true },
    });

    if (!user) return res.json({ authenticated: false });

    const isExpired = user.tokenExpiresAt < new Date();
    res.json({
      authenticated: !isExpired,
      userId: user.id,
      expiresAt: user.tokenExpiresAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check auth status' });
  }
});

module.exports = router;
