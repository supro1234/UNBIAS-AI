<p align="center">
  <img src="https://img.shields.io/badge/Google-Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Three.js-WebGL-000000?style=for-the-badge&logo=three.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Puppeteer-SPA_Crawler-40B5A4?style=for-the-badge&logo=puppeteer&logoColor=white" />
</p>

# 🛡️ UnbiasNet — AI Fairness & Bias Auditor

> **Google Hackathon Submission** — Powered exclusively by Google Gemini AI

UnbiasNet is an AI-powered fairness auditing platform that crawls any public website and detects representational, geographic, and linguistic bias using **Google Gemini**. It generates comprehensive audit reports with evidence-based findings — downloadable as professional DOCX documents.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔍 **Deep SPA Crawling** | Puppeteer-based headless browser crawls up to **8 pages across 3 depth levels** — landing → sub-pages → individual job postings & DEI pages |
|  **Gemini AI Analysis** | Strict evidence-based audit prompt with **zero hallucination** rules — every claim requires a direct text quote |
|  **Interactive Dashboard** | Live fairness trend charts, score distributions, audit radar, and scan history — all built with Recharts |
| 📄 **DOCX Report Download** | Professional 7-section audit report generated client-side with `docx` library — includes tables, color-coded scores, and methodology |
|  **3D Cyber Background** | Subtle WebGL sphere with GLSL shaders, orbital particles, and deep-field stars via React Three Fiber |
| 🔐 **In-Memory API Keys** | API keys are never persisted to disk, cookies, or localStorage — purely in-memory for maximum security |
|  **Model Fallback Chain** | `gemini-2.0-flash` → `gemini-2.5-flash` → `gemini-2.5-pro` — balances free-tier usage with quality |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                 │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │Dashboard │  │ Analyze  │  │ Scenarios│  │  Reports   │  │
│  │ (Charts) │  │ (Audit)  │  │ (Presets)│  │  (History) │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │             │              │         │
│  ┌────┴──────────────┴─────────────┴──────────────┴──────┐  │
│  │           3D WebGL Background (Three.js)              │  │
│  │      Cyber Sphere + Orbit Rings + Deep Field          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP API
┌─────────────────────────┴───────────────────────────────────┐
│                   BACKEND (Express.js)                      │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Puppeteer   │  │  Gemini AI   │  │  In-Memory Store   │  │
│  │  SPA Crawler │→ │  Audit Engine│→ │  (Scan History)    │  │
│  │  (3 levels)  │  │  (Strict)    │  │  (Last 50 scans)   │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 How the Audit Works

### 1. Deep Crawling (Puppeteer)
```
Landing Page (depth 0)
├── /careers        (depth 1)
│   ├── /careers/engineer-role    (depth 2)
│   └── /careers/apply            (depth 2)
├── /about          (depth 1)
├── /diversity      (depth 1)  ← prioritized
│   └── /diversity/reports        (depth 2)
└── /terms          (depth 1)
```

- Crawls **up to 8 pages** across 3 depth levels
- Prioritizes **DEI/diversity pages** and **job detail pages**
- Captures **8000 chars body text + 1500 chars footer text** per page
- Extracts h1–h3 headings, form labels (including `aria-label`), and nav links

### 2. Strict Gemini Audit Prompt

The AI follows 5 non-negotiable rules:

| Rule | Purpose |
|------|---------|
| **ZERO HALLUCINATION** | Findings based ONLY on provided text — no outside knowledge |
| **MANDATORY EVIDENCE** | Every bias claim requires an exact quote from the scraped text |
| **MISSING DATA ≠ BIAS** | Can't find DEI statement? → "Insufficient data", NOT a penalty |
| **CONTEXTUAL AWARENESS** | Scans for "remote", "work from home", "global" before flagging geographic bias |
| **NO EXTRAPOLATION** | Investor list demographics ≠ company-wide hiring bias |

### 3. Fairness Metrics

| Metric | Standard | Reference |
|--------|----------|-----------|
| Disparate Impact | 4/5ths Rule (80% threshold) | EEOC Uniform Guidelines, 1978 |
| Statistical Parity | Equal selection rates across groups | Dwork et al., 2012 |
| Equal Opportunity | True positive rate equality | Hardt, Price & Srebro, 2016 |
| Proxy Correlation | Indirect discrimination via features | Pedreshi, Ruggieri & Turini, 2008 |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ 
- **Google Chrome** or **Microsoft Edge** (for Puppeteer headless crawling)
- **Gemini API Key** — Get one free at [ai.google.dev](https://ai.google.dev/)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/unbiased-ai.git
cd unbiased-ai

# Install dependencies
npm install

# Start both frontend + backend
npm run dev
```

This runs:
- **Frontend** (Vite) → `http://localhost:5173`
- **Backend** (Express) → `http://localhost:3001`

### First Run

1. Open `http://localhost:5173`
2. Click **"Begin Audit"** on the welcome screen
3. Enter your **Gemini API Key** (in-memory only, never stored)
4. Navigate to **Analyze** → paste any URL → click **Audit**
5. View results → **Download DOCX Report**

---

## 📁 Project Structure

```
unbiased-ai/
├── server/
│   └── index.js              # Express backend — crawler + Gemini API
├── src/
│   ├── components/
│   │   ├── NetworkBackground  # 3D WebGL cyber sphere (GLSL shaders)
│   │   ├── Dashboard          # Live scan history charts (Recharts)
│   │   ├── Layout             # Page layout wrapper
│   │   ├── Sidebar            # Navigation sidebar
│   │   ├── WelcomeScreen      # Animated landing page
│   │   └── ApiKeySetup        # Secure key input
│   ├── pages/
│   │   ├── AnalyzePage        # URL input + full audit visualization
│   │   ├── DatasetsPage       # Pre-loaded audit scenarios (8 real URLs)
│   │   ├── ModelsPage         # Gemini engine documentation
│   │   └── ReportsPage        # Scan history + DOCX download
│   ├── utils/
│   │   └── generateReport.ts  # Client-side DOCX report generation
│   ├── App.tsx                # Root router
│   └── index.css              # Global styles + animations
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI Engine** | Google Gemini (`@google/genai`) | Fairness analysis with structured JSON output |
| **Frontend** | React 19, TypeScript 6, Vite 8 | SPA with type-safe components |
| **Charts** | Recharts | Radar, scatter, bar, area charts |
| **3D Graphics** | Three.js, React Three Fiber | WebGL cyber sphere background |
| **Crawler** | Puppeteer Core | Headless SPA crawling (3 depth levels) |
| **Backend** | Express 5 | REST API server |
| **Reports** | docx + file-saver | Client-side DOCX generation |
| **Icons** | Lucide React | 50+ UI icons |

---

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/validate-key` | POST | Validates Gemini API key (uses `gemini-2.0-flash` ping) |
| `/api/live-audit` | POST | Full crawl + Gemini audit pipeline → returns JSON results |
| `/api/scan-history` | GET | Returns last 50 scan results for dashboard charts |
| `/api/summary` | GET | Aggregate stats (total scans, avg score, model health) |

---

## 🔒 Security

- **API keys are NEVER persisted** — stored only in React state (RAM)
- **No cookies, no localStorage, no sessionStorage** used for sensitive data
- **Keys are refreshed on page reload** — user must re-enter
- **Server-side only** — API key is sent to Express, used for Gemini call, then discarded

---

## 📝 DOCX Report Sections

The downloadable audit report contains 7 professional sections:

1. **Cover Page** — Target URL, date, engine used, overall score
2. **Executive Summary** — Score classification (Fair/Warning/Critical) + recommendation
3. **AI Reasoning & Findings** — Evidence-based narrative with text quotes
4. **Disparate Impact Analysis** — 4/5ths rule table per demographic group
5. **Statistical Parity Analysis** — Deviation from population mean
6. **Equal Opportunity Analysis** — True positive rate comparison
7. **Feature Bias Correlation** — Proxy variable detection with recommendations

---

## 📖 API Documentation

The backend service runs completely locally and provides JSON-based REST APIs.

### `POST /api/validate-key`
Validates if a given Gemini API Key is working.
- **Request Body**: `{ "apiKey": "string" }`
- **Response**: `{ "success": true }` or `{ "success": false, "error": "Reason" }`

### `POST /api/live-audit`
Runs a deep SPA crawl and passes extracted data to the Gemini engine for fairness analysis.
- **Request Body**: `{ "url": "https://example.com", "apiKey": "string" }`
- **Response**: Returns a full `AuditResult` object including `overallBiasScore`, `keyFindings`, and `analysisResults`.

### `GET /api/scan-history`
Fetches the last 50 successful scans from the in-memory database.
- **Response**: `{ "success": true, "history": [{ "url": "...", "overallBiasScore": 85 }] }`

### `POST /api/mitigate`
Instructs the platform to perform a virtual mitigation on a specified model.
- **Request Body**: `{ "modelId": "string" }`
- **Response**: `{ "success": true, "newFairnessScore": 92 }`

---

## 🚀 Deployment Guide

### Single-Service Deployment (Render / Railway)
Since the `unbiased-ai` repository has a customized `render.yaml` and a `Dockerfile`, it can be deployed easily as a unified service. 

1. **Push to GitHub**: Make sure your code is on a remote branch.
2. **Setup on Render**: Connect your GitHub repository to Render and use the `render.yaml` configuration.
3. **Puppeteer Dependencies**: The provided Dockerfile is explicitly configured with necessary apt-packages to run a headless Chrome environment, ensuring crawling works perfectly in production.
4. **Environment Variables**: No sensitive backend variables are required natively. End-users provide their own Gemini API keys!

### Local Docker Build
If deploying on private infrastructure:
```bash
docker build -t unbiased-ai:latest .
docker run -p 3001:3001 -p 5173:5173 unbiased-ai:latest
```

---

## 🤝 Contribution Guide

We embrace community contributions! To get started:

1. **Fork & Clone**: Fork the repository and clone it to your local machine.
2. **Branching Strategy**: Create a feature branch with a descriptive name (e.g., `feature/sidebar-accessibility` or `bugfix/chart-contrast`).
3. **Run the Test Suite**: Before committing, ensure you run the unit tests:
   ```bash
   npm test
   ```
4. **Lint your code**: Run the built-in linter to check for structural issues:
   ```bash
   npm run lint
   ```
5. **Open a PR**: Submit your Pull Request detailing what you changed, why it’s needed, and link to any relevant issues.

---

<p align="center">
  <strong>UnbiasNet</strong> — Making AI Fairness Accessible<br>
  <sub>Powered by Google Gemini AI • Built with React + TypeScript + Three.js</sub>
</p>
