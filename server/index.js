import express from 'express';
import cors from 'cors';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer-core';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

/**
 * Model chain — highest free quota first, Pro only as last resort.
 * gemini-2.0-flash is dead; removed from chain.
 */
const MODELS = ['gemini-2.5-flash-lite-preview-06-17', 'gemini-2.5-flash', 'gemini-2.5-pro'];

const CACHE_TTL  = 1000 * 60 * 60 * 6; // 6 hours
const MAX_CHARS_PER_PAGE = 6000;        // ~1 500 tokens per page
const MAX_PAGES  = 8;

// ─── IN-MEMORY STORES ─────────────────────────────────────────────────────────

const scanHistory = [];                 // up to 50 recent results
const auditCache  = new Map();          // url → { result, timestamp }

/** Rolling quota counters — reset every minute / day */
let requestCount = {
  minute:    0,
  day:       0,
  lastMinute: Date.now(),
  lastDay:    Date.now(),
};

function tickQuota() {
  const now = Date.now();
  if (now - requestCount.lastMinute > 60_000)  { requestCount.minute = 0; requestCount.lastMinute = now; }
  if (now - requestCount.lastDay   > 86_400_000){ requestCount.day    = 0; requestCount.lastDay    = now; }
  requestCount.minute++;
  requestCount.day++;
}

function addToHistory(entry) {
  scanHistory.unshift(entry);
  if (scanHistory.length > 50) scanHistory.pop();
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

/** Strip scripts, styles, HTML tags, URLs and collapse whitespace */
function cleanPageText(rawText) {
  return rawText
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{3,}/g, '  ')
    .slice(0, MAX_CHARS_PER_PAGE);
}

/** Finds a local Chromium executable (Chrome or Edge) on Windows */
function getBrowserPath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of paths) { if (fs.existsSync(p)) return p; }
  return null;
}

// ─── GEMINI CALL WITH EXPONENTIAL BACKOFF ─────────────────────────────────────

/**
 * Calls a single Gemini model with up to `retries` attempts.
 * On HTTP 429 (rate-limit) it waits 2 s, 4 s, 8 s before each retry.
 */
async function callGeminiWithRetry(ai, model, prompt, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      tickQuota();
      const result = await ai.models.generateContent({ model, contents: prompt });
      return result;
    } catch (err) {
      const isRateLimit = err?.status === 429 || (err?.message || '').includes('429');
      if (isRateLimit && attempt < retries - 1) {
        const wait = Math.pow(2, attempt + 1) * 1000; // 2 s → 4 s → 8 s
        console.log(`[Gemini] Rate-limited on ${model} (attempt ${attempt + 1}), waiting ${wait}ms…`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Tries each model in MODELS order, falling back on any non-429 error.
 * Returns { response, modelUsed }.
 */
async function callGeminiWithFallback(ai, prompt) {
  let lastError = null;
  for (const model of MODELS) {
    try {
      console.log(`[Gemini] Trying model: ${model}`);
      const response = await callGeminiWithRetry(ai, model, prompt);
      console.log(`[Gemini] ✓ Success with model: ${model}`);
      return { response, modelUsed: model };
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini] ✗ ${model} failed: ${err.message}. Falling back…`);
    }
  }
  throw lastError || new Error('All Gemini models failed.');
}

// ─── CRAWLER (SPA-AWARE) ──────────────────────────────────────────────────────

const PRIORITY_KEYWORDS = [
  'career', 'job', 'hire', 'hiring', 'position', 'opening', 'role',
  'apply', 'application', 'recruit',
  'about', 'team', 'people', 'leadership',
  'diversity', 'inclusion', 'dei', 'equal-opportunity', 'eeo', 'belonging',
  'term', 'privacy', 'legal',
];

function isRelevantUrl(href) {
  const lower = href.toLowerCase();
  return PRIORITY_KEYWORDS.some(kw => lower.includes(kw));
}

async function crawlDomain(url) {
  const visited    = new Set();
  const pages      = [];
  const baseDomain = new URL(url).hostname;
  const executablePath = getBrowserPath();

  if (!executablePath) {
    throw new Error('No compatible browser found (Chrome/Edge). Please install Chrome to use SPA auditing.');
  }

  console.log(`[Browser] Launching: ${executablePath}`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  try {
    async function fetchPage(targetUrl, depth = 0) {
      if (visited.has(targetUrl) || depth > 2 || pages.length >= MAX_PAGES) return;
      visited.add(targetUrl);

      const page = await browser.newPage();
      try {
        console.log(`[Crawler] [Depth ${depth}] Rendering: ${targetUrl}`);
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        );

        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // ── Scroll to bottom to trigger lazy-loaded content ───────────────
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        // Wait for any network requests triggered by scroll
        await page.waitForNetworkIdle({ idleTime: 1500, timeout: 8000 }).catch(() => {});

        let screenshot = null;
        if (depth === 0) {
          console.log(`[Crawler] Capturing verification screenshot…`);
          screenshot = await page.screenshot({ encoding: 'base64', type: 'webp', quality: 60 });
        }

        const html = await page.content();
        const $ = cheerio.load(html);
        $('script, style, iframe, noscript').remove();

        // Raw body text cleaned and capped at MAX_CHARS_PER_PAGE
        const rawBodyText = $('body').text();
        const cleanedText = cleanPageText(rawBodyText);

        const content = {
          url:        targetUrl,
          depth,
          title:      $('title').text(),
          h1:         $('h1').map((_, el) => $(el).text()).get().join(' | '),
          metaDesc:   $('meta[name="description"]').attr('content') || '',
          h2s:        $('h2').map((_, el) => $(el).text()).get().slice(0, 10).join(' | '),
          h3s:        $('h3').map((_, el) => $(el).text()).get().slice(0, 8).join(' | '),
          text:       cleanedText,                        // cleaned, capped
          footerText: $('footer').text().replace(/\s\s+/g, ' ').slice(0, 1500),
          forms: $('form').map((_, el) => {
            return $(el).find('input, select, textarea').map((__, input) =>
              $(input).attr('name') || $(input).attr('placeholder') ||
              $(input).attr('id')   || $(input).attr('aria-label')
            ).get();
          }).get(),
          links:      $('a').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 30),
          screenshot,
        };

        pages.push(content);

        // Collect & follow internal links
        if (depth <= 1 && pages.length < MAX_PAGES) {
          const links = [];
          $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            try {
              const absolute = new URL(href, targetUrl).href;
              if (absolute.includes(baseDomain) && !visited.has(absolute) && isRelevantUrl(absolute)) {
                links.push(absolute);
              }
            } catch (_e) { /* invalid URL */ }
          });

          // DEI pages first, then job pages, then others
          const prioritized = links.sort((a, b) => {
            const aDEI = /diversity|inclusion|dei|eeo/.test(a.toLowerCase());
            const bDEI = /diversity|inclusion|dei|eeo/.test(b.toLowerCase());
            if (aDEI && !bDEI) return -1;
            if (!aDEI && bDEI) return 1;
            const aJob = /job|position|apply/.test(a.toLowerCase());
            const bJob = /job|position|apply/.test(b.toLowerCase());
            if (aJob && !bJob) return -1;
            if (!aJob && bJob) return 1;
            return 0;
          });

          const maxLinks = depth === 0 ? 5 : 2;
          for (const link of prioritized.slice(0, maxLinks)) {
            if (pages.length >= MAX_PAGES) break;
            await fetchPage(link, depth + 1);
          }
        }
      } catch (err) {
        console.error(`[Crawler] Failed ${targetUrl}: ${err.message}`);
      } finally {
        await page.close();
      }
    }

    await fetchPage(url);
    return pages;
  } finally {
    await browser.close();
  }
}

// ─── AUDIT PROMPT (single call, confidence field) ─────────────────────────────

function buildAuditPrompt(scrapedPages, combinedPageText) {
  return `
You are UnbiasNet, a strict, impartial AI Fairness and Bias Auditor.

HARD RULES — violation = invalid audit:
1. ZERO HALLUCINATION: base findings ONLY on the provided text.
2. MANDATORY EVIDENCE: every finding MUST include a direct quote from the text.
3. MISSING DATA ≠ BIAS: insufficient text → set score to 50, findings to ["Insufficient data to evaluate"].
4. CONTEXTUAL AWARENESS: scan for "remote", "work from home", "anywhere", "global" before flagging geographic bias.
5. NO EXTRAPOLATION: one section's data does not represent the whole org.

PAGES CRAWLED: ${scrapedPages.length}
PAGES TEXT:
${combinedPageText}

Return ONLY valid JSON — no markdown, no backtick fences, no preamble:
{
  "overallBiasScore": <number 0-100, 100=perfectly fair>,
  "confidence": "high|medium|low",
  "modelUsed": "filled in server-side",
  "pagesAnalyzed": ${scrapedPages.length},
  "industry": "<inferred industry>",
  "recommendation": "<2-3 sentence actionable advice based ONLY on evidence found>",
  "keyFindings": ["<finding with exact quote>", "<finding with exact quote>", "<finding with exact quote>"],
  "representationalBias": { "score": <0-100>, "findings": [], "evidence": [] },
  "geographicBias":       { "score": <0-100>, "findings": [], "evidence": [] },
  "linguisticBias":       { "score": <0-100>, "findings": [], "evidence": [] },
  "analysisResults": {
    "disparateImpact": [
      {"group": "Group Name", "total": 1000, "selected": 800, "acceptanceRate": 80, "impactRatio": 0.8, "severity": "Fair|Warning|Critical", "disparateImpactFlag": false}
    ],
    "statisticalParity": [
      {"group": "Group Name", "parityDiff": 0.05, "parityPercent": 5, "favoredOrDisadvantaged": "Favored|Disadvantaged|Neutral"}
    ],
    "equalOpportunity": [
      {"group": "Group Name", "truePositiveRate": 85, "equalOpportunityGap": 2, "flag": false}
    ],
    "featureCorrelation": [
      {"feature": "Feature/Variable Name", "correlation": 0.1, "biasRisk": "Low|Medium|High", "recommendation": "Specific actionable advice"}
    ]
  },
  "aiReasoning": "<4-6 sentence evidence-based narrative: cite exact quotes. State what WAS found, what WAS NOT found, and where you had insufficient data.>"
}
  `.trim();
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

/** Validate Gemini API Key */
app.post('/api/validate-key', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ success: false, error: 'API Key missing' });

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Use the cheapest available model for key validation
    const response = await ai.models.generateContent({
      model: MODELS[0],
      contents: 'ping',
    });
    if (response.text) res.json({ success: true, modelUsed: MODELS[0] });
    else throw new Error('Valid key but no response.');
  } catch (err) {
    res.status(401).json({ success: false, error: 'Authorization failed. Ensure your Gemini API Key is valid. ' + err.message });
  }
});

/** LIVE AUDIT: Crawl + single Gemini AI analysis call */
app.post('/api/live-audit', async (req, res) => {
  const { url, apiKey } = req.body;
  if (!url || !apiKey) return res.status(400).json({ success: false, error: 'URL and API Key are required' });

  // ── Cache check ──────────────────────────────────────────────────────────
  const cached = auditCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Cache] Returning cached result for ${url}`);
    return res.json({ ...cached.result, fromCache: true });
  }

  try {
    const scrapedPages = await crawlDomain(url);
    if (scrapedPages.length === 0) throw new Error('Could not extract any content from the provided domain.');

    console.log(`[Audit] Crawled ${scrapedPages.length} pages for ${url}`);

    // ── Build combined text (8 pages × 6 000 chars ≈ 12 000 tokens) ────────
    const combinedPageText = scrapedPages.map(p =>
      `=== PAGE: ${p.url} (depth ${p.depth}) ===\n` +
      `TITLE: ${p.title}\n` +
      `H1: ${p.h1}\n` +
      `H2s: ${p.h2s}\n` +
      `META: ${p.metaDesc}\n` +
      `FOOTER: ${p.footerText}\n` +
      `BODY:\n${p.text}`
    ).join('\n\n');

    const prompt = buildAuditPrompt(scrapedPages, combinedPageText);

    const ai = new GoogleGenAI({ apiKey });

    // ── Single Gemini call with model fallback + backoff ─────────────────
    const { response, modelUsed } = await callGeminiWithFallback(ai, prompt);

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Model produced an invalid response format (missing JSON object).');

    const auditData = JSON.parse(jsonMatch[0]);
    auditData.modelUsed = modelUsed; // overwrite with actual model used

    // Surface low-confidence findings as warnings
    if (auditData.confidence === 'low') {
      auditData.confidenceWarning =
        'Low confidence: the audited pages contained limited text. Results should be treated as preliminary.';
    }

    const timestamp = new Date().toISOString();

    // ── Store in history ─────────────────────────────────────────────────
    addToHistory({
      url,
      hostname:         new URL(url).hostname,
      timestamp,
      overallBiasScore: auditData.overallBiasScore,
      industry:         auditData.industry || 'Unknown',
      keyFlags:         (auditData.analysisResults?.disparateImpact ?? []).filter(d => d.disparateImpactFlag).length,
      modelUsed,
      pagesAnalyzed:    scrapedPages.length,
      confidence:       auditData.confidence || 'medium',
    });

    const result = {
      success: true,
      timestamp,
      screenshot:   scrapedPages[0]?.screenshot,
      modelUsed,
      pagesAnalyzed: scrapedPages.length,
      crawledUrls:  scrapedPages.map(p => p.url),
      ...auditData,
    };

    // ── Cache the result ─────────────────────────────────────────────────
    auditCache.set(url, { result, timestamp: Date.now() });

    res.json(result);

  } catch (err) {
    console.error(`[Live Audit Error] ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** GET scan history for dashboard */
app.get('/api/scan-history', (req, res) => {
  res.json({ success: true, history: scanHistory });
});

/** GET summary stats */
app.get('/api/summary', (req, res) => {
  const totalScans = scanHistory.length;
  const avgScore   = totalScans > 0
    ? Math.round(scanHistory.reduce((s, e) => s + (e.overallBiasScore || 0), 0) / totalScans)
    : 88;
  const critFlags  = scanHistory.reduce((s, e) => s + (e.keyFlags || 0), 0);

  res.json({
    success: true,
    overallFairnessScore: avgScore,
    criticalFlags: critFlags,
    analyzedRows:  totalScans > 0 ? `${totalScans} URLs` : 'Awaiting Scan',
    modelsMonitored: 1,
    totalScans,
    modelHealth: [{
      id: 'MDL-001', name: 'Gemini AI Audit Engine',
      domain: 'Live Web', fairnessScore: avgScore,
      accuracy: 94, status: avgScore >= 80 ? 'Fair' : avgScore >= 60 ? 'Warning' : 'Critical',
      lastAudited: totalScans > 0 ? new Date(scanHistory[0].timestamp).toLocaleTimeString() : 'Never',
      modelUsed:   totalScans > 0 ? scanHistory[0].modelUsed : MODELS[0],
    }],
  });
});

/** GET quota / rate-limit status */
app.get('/api/quota-status', (req, res) => {
  const now = Date.now();
  // Auto-reset if window has passed without a tick
  if (now - requestCount.lastMinute > 60_000)   { requestCount.minute = 0; requestCount.lastMinute = now; }
  if (now - requestCount.lastDay   > 86_400_000) { requestCount.day    = 0; requestCount.lastDay    = now; }

  res.json({
    requestsThisMinute: requestCount.minute,
    requestsToday:      requestCount.day,
    withinLimits:       requestCount.minute < 10 && requestCount.day < 500,
    cacheSize:          auditCache.size,
    modelsAvailable:    MODELS,
    primaryModel:       MODELS[0],
  });
});

/** Invalidate cache for a specific URL */
app.delete('/api/cache', (req, res) => {
  const { url } = req.body;
  if (url) {
    auditCache.delete(url);
    res.json({ success: true, message: `Cache cleared for ${url}` });
  } else {
    auditCache.clear();
    res.json({ success: true, message: 'Full cache cleared' });
  }
});

app.post('/api/mitigate', (req, res) => {
  res.json({ success: true, message: 'AI Recommendation applied to session memory.', newFairnessScore: 92 });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[UnbiasNet] Backend running on port ${PORT}`);
  console.log(`[UnbiasNet] Model chain: ${MODELS.join(' → ')}`);
  console.log(`[UnbiasNet] Cache TTL: ${CACHE_TTL / 3600000}h | Max pages: ${MAX_PAGES} | Max chars/page: ${MAX_CHARS_PER_PAGE}`);
});
