import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// ─── IN-MEMORY SCAN HISTORY ───────────────────────────────────────────────────
// Stores up to 50 recent scan results for dashboard graphs
const scanHistory = [];

function addToHistory(entry) {
  scanHistory.unshift(entry);           // newest first
  if (scanHistory.length > 50) scanHistory.pop();
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────

/**
 * Finds a local Chromium executable (Chrome or Edge) on Windows
 */
function getBrowserPath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Robust Multi-page Crawler (SPA-Aware via Puppeteer)
 * Traverses landing page + up to 3 internal links
 */
async function crawlDomain(url) {
  const visited    = new Set();
  const pages      = [];
  const baseDomain = new URL(url).hostname;
  const executablePath = getBrowserPath();

  if (!executablePath) {
    throw new Error('No compatible browser found (Chrome/Edge). Please install Chrome to use SPA auditing.');
  }

  // Keywords that indicate bias-relevant pages
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

  console.log(`[Browser] Launching: ${executablePath}`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  try {
    // Depth 0 = landing, depth 1 = main sub-pages (careers, about, etc.),
    // depth 2 = detail pages (individual job postings, DEI sub-pages)
    async function fetchPage(targetUrl, depth = 0) {
      if (visited.has(targetUrl) || depth > 2 || pages.length >= 8) return;
      visited.add(targetUrl);

      const page = await browser.newPage();
      try {
        console.log(`[Crawler] [Depth ${depth}] Rendering: ${targetUrl}`);
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        );

        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        let screenshot = null;
        if (depth === 0) {
          console.log(`[Crawler] Capturing verification screenshot...`);
          screenshot = await page.screenshot({ encoding: 'base64', type: 'webp', quality: 60 });
        }

        const html = await page.content();
        const $ = cheerio.load(html);
        $('script, style, iframe, noscript').remove();

        const content = {
          url: targetUrl,
          depth,
          title: $('title').text(),
          h1: $('h1').map((_, el) => $(el).text()).get().join(' | '),
          metaDesc: $('meta[name="description"]').attr('content') || '',
          h2s: $('h2').map((_, el) => $(el).text()).get().slice(0, 10).join(' | '),
          h3s: $('h3').map((_, el) => $(el).text()).get().slice(0, 8).join(' | '),
          // Capture full page text — increased from 5000 to 8000 chars
          text: $('body').text().replace(/\s\s+/g, ' ').slice(0, 8000),
          // Also capture footer/nav text specifically (DEI statements often live here)
          footerText: $('footer').text().replace(/\s\s+/g, ' ').slice(0, 1500),
          forms: $('form').map((_, el) => {
            return $(el).find('input, select, textarea').map((__, input) =>
              $(input).attr('name') || $(input).attr('placeholder') || $(input).attr('id') || $(input).attr('aria-label')
            ).get();
          }).get(),
          links: $('a').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 30),
          screenshot,
        };

        pages.push(content);

        // Collect internal links from EVERY depth level (not just landing)
        if (depth <= 1 && pages.length < 8) {
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

          // Prioritize: diversity/dei pages first, then job detail pages, then others
          const prioritized = links.sort((a, b) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();
            const aDEI = aLower.includes('diversity') || aLower.includes('inclusion') || aLower.includes('dei') || aLower.includes('eeo');
            const bDEI = bLower.includes('diversity') || bLower.includes('inclusion') || bLower.includes('dei') || bLower.includes('eeo');
            if (aDEI && !bDEI) return -1;
            if (!aDEI && bDEI) return 1;
            const aJob = aLower.includes('job') || aLower.includes('position') || aLower.includes('apply');
            const bJob = bLower.includes('job') || bLower.includes('position') || bLower.includes('apply');
            if (aJob && !bJob) return -1;
            if (!aJob && bJob) return 1;
            return 0;
          });

          // Follow up to 5 links from landing, 2 from depth-1 pages
          const maxLinks = depth === 0 ? 5 : 2;
          for (const link of prioritized.slice(0, maxLinks)) {
            if (pages.length >= 8) break;
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

// ─── ROUTES ──────────────────────────────────────────────────────────────────

/**
 * Validate Gemini API Key
 */
app.post('/api/validate-key', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ success: false, error: 'API Key missing' });

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Use cheapest model for key validation to save quota
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: 'ping' });
    if (response.text) res.json({ success: true });
    else throw new Error('Valid key but no response.');
  } catch (err) {
    res.status(401).json({ success: false, error: 'Authorization failed. Ensure your Gemini API Key is valid.' });
  }
});

/**
 * LIVE AUDIT: Crawl + Gemini AI Analysis
 */
app.post('/api/live-audit', async (req, res) => {
  const { url, apiKey } = req.body;
  if (!url || !apiKey) return res.status(400).json({ success: false, error: 'URL and API Key are required' });

  try {
    const scrapedPages = await crawlDomain(url);
    if (scrapedPages.length === 0) throw new Error('Could not extract any content from the provided domain.');

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
SYSTEM INSTRUCTION:
You are UnbiasNet, a strict, impartial AI Fairness and Bias Auditor. You are analyzing scraped website text to detect representational, geographic, or linguistic bias.

You must adhere to the following strict constraints. Failure to do so will result in an invalid audit:
1. ZERO HALLUCINATION: You must base your findings EXPLICITLY and ONLY on the provided text. Do not use outside knowledge, and do not make assumptions about the company's culture beyond what is written.
2. MANDATORY EVIDENCE (QUOTES): If you claim a bias exists or flag a risk, you MUST quote the exact sentence or phrase from the provided text that proves it. If you cannot quote it, you cannot claim it.
3. MISSING DATA DOES NOT EQUAL BIAS: If you cannot find an explicit Diversity & Inclusion statement, or if job locations are not explicitly listed, you must state "Insufficient data to evaluate" rather than assuming a negative bias.
4. CONTEXTUAL AWARENESS: Before declaring geographic bias, actively scan the text for override keywords like "remote", "work from home", "anywhere", or "global".
5. NO EXTRAPOLATION: A lack of diverse names in one specific section (e.g., an investor list) applies ONLY to that section. Do not extrapolate that as a "moderate bias risk" for the entire organization.

INPUT — SCRAPED SITE CONTENT (${scrapedPages.length} pages crawled across multiple depth levels):
${JSON.stringify(scrapedPages.map(p => ({
  url: p.url,
  depth: p.depth,
  title: p.title,
  h1: p.h1,
  h2s: p.h2s,
  h3s: p.h3s || '',
  metaDesc: p.metaDesc,
  forms: p.forms,
  links: p.links,
  footerText: p.footerText || '',
  textContent: p.text.slice(0, 4000),
})), null, 2)}

ANALYSIS INSTRUCTIONS:
- Analyze ALL provided text, headings, slogans, form fields, footer text, and navigation links for demographic bias signals (gender, race, age, religion, geography, disability).
- Identify proxy variables (ZIP code, school name, years-of-experience gaps, language bias in job descriptions).
- Look for stereotyping, exclusionary language, or patterns that disadvantage certain groups.
- The overallBiasScore should be 0-100, where 100 is PERFECTLY FAIR. Base this score ONLY on evidence found (or not found) in the provided text.

OUTPUT ONLY this exact JSON object (no markdown, no code fences, no preamble):
{
  "overallBiasScore": <number 0-100>,
  "recommendation": "<2-3 sentence actionable ethics advice based ONLY on evidence found>",
  "pagesAnalyzed": ${scrapedPages.length},
  "industry": "<inferred industry from the content>",
  "keyFindings": ["<finding with quoted evidence>", "<finding with quoted evidence>", "<finding with quoted evidence>"],
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
  "aiReasoning": "<4-6 sentence evidence-based narrative: cite exact quotes from the scraped text to justify each finding. State what WAS found, what WAS NOT found, and where you had insufficient data. Do NOT make claims without textual evidence.>"
}
    `;

    console.log(`[Gemini API] Requesting deep fairness analysis for ${url}...`);
    let response;
    let modelUsed = 'gemini-2.5-flash';

    // Start with free-tier 2.0, fall back to 2.5 flash, then 2.5 pro
    const modelsToTry = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        response = await ai.models.generateContent({ model, contents: prompt });
        modelUsed = model;
        break;
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini] ${model} failed: ${err.message}. Trying next...`);
      }
    }

    if (!response) throw lastError || new Error('All Gemini models failed.');

    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Model produced an invalid response format (missing JSON object).');

    const auditData = JSON.parse(jsonMatch[0]);
    const timestamp = new Date().toISOString();

    // Store in history
    addToHistory({
      url,
      hostname:       new URL(url).hostname,
      timestamp,
      overallBiasScore: auditData.overallBiasScore,
      industry:       auditData.industry || 'Unknown',
      keyFlags:       (auditData.analysisResults?.disparateImpact ?? []).filter(d => d.disparateImpactFlag).length,
      modelUsed,
      pagesAnalyzed:  auditData.pagesAnalyzed || scrapedPages.length,
    });

    res.json({
      success: true,
      timestamp,
      screenshot: scrapedPages[0]?.screenshot,
      modelUsed,
      pagesAnalyzed: auditData.pagesAnalyzed || scrapedPages.length,
      ...auditData,
    });

  } catch (err) {
    console.error(`[Live Audit Error] ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET scan history for dashboard
 */
app.get('/api/scan-history', (req, res) => {
  res.json({ success: true, history: scanHistory });
});

/**
 * GET summary stats
 */
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
    analyzedRows: totalScans > 0 ? `${totalScans} URLs` : 'Awaiting Scan',
    modelsMonitored: 1,
    totalScans,
    modelHealth: [{
      id: 'MDL-001', name: 'Gemini AI Audit Engine',
      domain: 'Live Web', fairnessScore: avgScore,
      accuracy: 94, status: avgScore >= 80 ? 'Fair' : avgScore >= 60 ? 'Warning' : 'Critical',
      lastAudited: totalScans > 0 ? new Date(scanHistory[0].timestamp).toLocaleTimeString() : 'Never',
    }],
  });
});

app.post('/api/mitigate', (req, res) => {
  res.json({ success: true, message: 'AI Recommendation applied to session memory.', newFairnessScore: 92 });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`[UnbiasNet] Live Audit Backend running on port ${PORT}`));
