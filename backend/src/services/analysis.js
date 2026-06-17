const Anthropic = require('@anthropic-ai/sdk');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Calculate time-in-range statistics from readings
 */
function calculateStats(readings) {
  if (!readings.length) return null;

  const values = readings.map(r => r.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  const inRange = values.filter(v => v >= 70 && v <= 180).length;
  const below = values.filter(v => v < 70).length;
  const above = values.filter(v => v > 180).length;

  const timeInRange = (inRange / values.length) * 100;
  const timeBelow = (below / values.length) * 100;
  const timeAbove = (above / values.length) * 100;

  // GMI (Glucose Management Indicator) formula
  const gmi = 3.31 + 0.02392 * avg;

  // Coefficient of variation
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / avg) * 100;

  // Time of day breakdown
  const byHour = Array.from({ length: 24 }, (_, h) => {
    const hourReadings = readings.filter(r => new Date(r.displayTime).getHours() === h);
    if (!hourReadings.length) return null;
    const hourAvg = hourReadings.reduce((s, r) => s + r.value, 0) / hourReadings.length;
    return { hour: h, avg: Math.round(hourAvg), count: hourReadings.length };
  }).filter(Boolean);

  // Overnight (midnight-6am) average
  const overnight = readings.filter(r => {
    const h = new Date(r.displayTime).getHours();
    return h >= 0 && h < 6;
  });
  const overnightAvg = overnight.length
    ? overnight.reduce((s, r) => s + r.value, 0) / overnight.length
    : null;

  return {
    totalReadings: readings.length,
    avg: Math.round(avg),
    min: Math.min(...values),
    max: Math.max(...values),
    timeInRange: Math.round(timeInRange * 10) / 10,
    timeBelow: Math.round(timeBelow * 10) / 10,
    timeAbove: Math.round(timeAbove * 10) / 10,
    gmi: Math.round(gmi * 100) / 100,
    cv: Math.round(cv * 10) / 10,
    byHour,
    overnightAvg: overnightAvg ? Math.round(overnightAvg) : null,
  };
}

/**
 * Generate AI insights using Claude
 */
async function generateAIInsights(stats, period, readings) {
  if (!stats) return { insights: null, suggestions: null };

  // Build a summary of patterns for Claude
  const highHours = stats.byHour
    .filter(h => h.avg > 180)
    .map(h => `${h.hour}:00 (avg ${h.avg} mg/dL)`)
    .join(', ');

  const lowHours = stats.byHour
    .filter(h => h.avg < 80)
    .map(h => `${h.hour}:00 (avg ${h.avg} mg/dL)`)
    .join(', ');

  const rapidRises = readings.filter(r => r.trendRate && r.trendRate >= 2.0).length;
  const rapidFalls = readings.filter(r => r.trendRate && r.trendRate <= -2.0).length;

  const prompt = `You are analyzing continuous glucose monitoring (CGM) data for a child using a Dexcom G7. 
  
Here are the statistics for the ${period.toLowerCase()} period:
- Total readings: ${stats.totalReadings}
- Average glucose: ${stats.avg} mg/dL
- Min: ${stats.min} mg/dL, Max: ${stats.max} mg/dL
- Time in Range (70-180 mg/dL): ${stats.timeInRange}%
- Time Below Range (<70 mg/dL): ${stats.timeBelow}%
- Time Above Range (>180 mg/dL): ${stats.timeAbove}%
- Glucose Management Indicator (GMI): ${stats.gmi}%
- Coefficient of Variation: ${stats.cv}%
- Overnight average (midnight-6am): ${stats.overnightAvg ? stats.overnightAvg + ' mg/dL' : 'insufficient data'}
${highHours ? `- Hours with high averages: ${highHours}` : ''}
${lowHours ? `- Hours with low averages: ${lowHours}` : ''}
- Rapid rise events (≥2 mg/dL/min): ${rapidRises}
- Rapid fall events (≤-2 mg/dL/min): ${rapidFalls}

Please provide:
1. INSIGHTS: A clear, parent-friendly summary of the key patterns you see in this data (3-4 sentences). Note what is going well and what areas need attention.
2. SUGGESTIONS: 3-4 specific, actionable suggestions for the parents to discuss with their endocrinologist or diabetes care team. Be specific about timing and patterns.

Format your response as JSON with keys "insights" and "suggestions" (suggestions as an array of strings).
Do not include markdown code fences. Return only valid JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    const parsed = JSON.parse(text);
    return {
      insights: parsed.insights || null,
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.join('\n• ')
        : parsed.suggestions || null,
    };
  } catch (err) {
    console.error('[Analysis] Claude API error:', err.message);
    return { insights: null, suggestions: null };
  }
}

/**
 * Run a full analysis for a user over a given period
 */
async function runAnalysis(userId, period = 'DAILY') {
  const now = new Date();
  let startDate;

  if (period === 'DAILY') {
    startDate = new Date(now - 24 * 60 * 60 * 1000);
  } else if (period === 'WEEKLY') {
    startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
  }

  const readings = await prisma.glucoseReading.findMany({
    where: {
      userId,
      displayTime: { gte: startDate, lte: now },
    },
    orderBy: { displayTime: 'asc' },
  });

  if (readings.length < 12) {
    return { error: 'Not enough data for analysis (need at least 1 hour of readings)' };
  }

  const stats = calculateStats(readings);
  const { insights, suggestions } = await generateAIInsights(stats, period, readings);

  // Save to database
  const report = await prisma.analysisReport.create({
    data: {
      userId,
      period,
      startDate,
      endDate: now,
      avgGlucose: stats.avg,
      timeInRange: stats.timeInRange,
      timeBelow: stats.timeBelow,
      timeAbove: stats.timeAbove,
      gmi: stats.gmi,
      cv: stats.cv,
      aiInsights: insights,
      aiSuggestions: suggestions,
    },
  });

  return { report, stats };
}

module.exports = { runAnalysis, calculateStats };
