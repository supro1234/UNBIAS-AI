import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, BorderStyle,
  WidthType, ShadingType, PageBreak,
} from 'docx';
import { saveAs } from 'file-saver';

// ─── Typed interfaces ────────────────────────────────────────────────────────

interface DisparateImpactRow {
  group: string;
  total?: number;
  applicants?: number;
  selected?: number;
  acceptanceRate?: number;
  impactRatio?: number;
  severity?: string;
  status?: string;
}

interface StatisticalParityRow {
  group: string;
  parityDiff?: number;
  parityPercent?: number;
  favoredOrDisadvantaged?: string;
}

interface EqualOpportunityRow {
  group: string;
  truePositiveRate?: number;
  equalOpportunityGap?: number;
  flag?: boolean;
}

interface FeatureCorrelationRow {
  feature: string;
  correlation?: number;
  biasRisk?: string;
  recommendation?: string;
}

interface AuditResults {
  overallBiasScore?: number;
  aiReasoning?: string;
  recommendation?: string;
  modelUsed?: string;
  timestamp?: string;
  industry?: string;
  analysisResults?: {
    disparateImpact?: DisparateImpactRow[];
    statisticalParity?: StatisticalParityRow[];
    equalOpportunity?: EqualOpportunityRow[];
    featureCorrelation?: FeatureCorrelationRow[];
  };
}

// ─── Colour helpers ──────────────────────────────────────────────────────────

const COLORS = {
  blue:   '4285F4',
  green:  '34A853',
  yellow: 'FBBC05',
  red:    'EA4335',
  gray:   '8B8FA8',
};

function scoreColor(s: number): string {
  return s >= 80 ? COLORS.green : s >= 60 ? COLORS.yellow : COLORS.red;
}

// ─── Docx helpers ────────────────────────────────────────────────────────────

function headerPara(text: string, color = COLORS.blue): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
  });
}

function subHead(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color: COLORS.blue })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
  });
}

function body(text: string, italic = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, italics: italic, color: '333333' })],
    spacing: { after: 80 },
  });
}

function divider(): Paragraph {
  return new Paragraph({
    border: { bottom: { color: 'CCCCCC', space: 1, style: BorderStyle.SINGLE, size: 6 } },
    spacing: { before: 200, after: 200 },
  });
}

function kv(label: string, value: string, valueColor?: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20, color: '555555' }),
      new TextRun({ text: value, size: 20, color: valueColor ?? '111111' }),
    ],
    spacing: { after: 60 },
  });
}

function makeTable(headers: string[], rows: string[][], headerBg = COLORS.blue): Table {
  const headerRow = new TableRow({
    children: headers.map(h =>
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18 })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { fill: headerBg, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
      })
    ),
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map(cell =>
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: cell, size: 18 })],
            alignment: AlignmentType.CENTER,
          })],
          shading: { fill: ri % 2 === 0 ? 'F4F7FF' : 'FFFFFF', type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        })
      ),
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top:     { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
      bottom:  { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
      left:    { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
      right:   { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'EEEEEE' },
      insideVertical:   { style: BorderStyle.SINGLE, size: 2, color: 'EEEEEE' },
    },
  });
}

// ─── Public export ───────────────────────────────────────────────────────────

export async function downloadAuditReport(results: AuditResults, url: string): Promise<void> {
  const {
    overallBiasScore = 0,
    aiReasoning,
    recommendation,
    analysisResults,
    modelUsed,
    timestamp,
  } = results;

  const di: DisparateImpactRow[]      = analysisResults?.disparateImpact      ?? [];
  const sp: StatisticalParityRow[]    = analysisResults?.statisticalParity    ?? [];
  const eo: EqualOpportunityRow[]     = analysisResults?.equalOpportunity     ?? [];
  const fc: FeatureCorrelationRow[]   = analysisResults?.featureCorrelation   ?? [];

  const date = new Date(timestamp || Date.now()).toLocaleString();
  const sc   = scoreColor(overallBiasScore);

  const doc = new Document({
    creator: 'UnbiasNet — AI Fairness Auditor',
    description: `Bias audit report for ${url}`,
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 20 } },
      },
    },
    sections: [{
      properties: {},
      children: [
        // ── COVER ─────────────────────────────────────────────────────────
        new Paragraph({
          children: [new TextRun({ text: 'UnbiasNet', bold: true, size: 56, color: COLORS.blue })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 1200, after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'AI Fairness & Bias Audit Report', size: 32, color: '444444' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }),
        divider(),
        kv('Target URL',            url),
        kv('Analysis Date',         date),
        kv('Engine',                modelUsed || 'Gemini AI'),
        kv('Overall Fairness Score',`${overallBiasScore}%`, `#${sc}`),
        divider(),
        new Paragraph({ children: [new PageBreak()] }),

        // ── EXECUTIVE SUMMARY ─────────────────────────────────────────────
        headerPara('1. Executive Summary'),
        body(`This report presents the findings of an automated AI-powered fairness and bias audit conducted by UnbiasNet on the domain "${url}". The analysis was performed by ${modelUsed || 'Gemini AI'} using multi-page SPA crawling followed by a deep fairness assessment.`),
        new Paragraph({ spacing: { after: 100 } }),
        kv('Overall Bias Score', `${overallBiasScore}% (${overallBiasScore >= 80 ? 'Fair' : overallBiasScore >= 60 ? 'Warning' : 'Critical'})`, `#${sc}`),
        kv("Auditor's Recommendation", recommendation ?? 'N/A'),
        divider(),

        // ── AI REASONING ──────────────────────────────────────────────────
        headerPara('2. AI Reasoning & Findings'),
        body(aiReasoning ?? 'No AI reasoning provided.', true),
        divider(),
        new Paragraph({ children: [new PageBreak()] }),

        // ── DISPARATE IMPACT ──────────────────────────────────────────────
        headerPara('3. Disparate Impact Analysis (4/5ths Rule)'),
        subHead('Results by Demographic Group'),
        body("The 4/5ths rule (80% rule) flags groups whose selection rate is less than 80% of the highest group's rate as potentially discriminatory."),
        new Paragraph({ spacing: { after: 160 } }),
        di.length > 0 ? makeTable(
          ['Group', 'Total Pool', 'Selected', 'Acceptance Rate', 'Impact Ratio', 'Status'],
          di.map(r => [
            r.group,
            String(r.total ?? r.applicants ?? '—'),
            String(r.selected ?? '—'),
            `${r.acceptanceRate ?? '—'}%`,
            String(r.impactRatio ?? '—'),
            r.severity ?? r.status ?? '—',
          ])
        ) : body('No disparate impact data available.'),
        divider(),

        // ── STATISTICAL PARITY ────────────────────────────────────────────
        headerPara('4. Statistical Parity Analysis'),
        subHead('Deviation from Population Mean'),
        body('Statistical parity measures the difference in selection rates between demographic groups relative to the overall population mean.'),
        new Paragraph({ spacing: { after: 160 } }),
        sp.length > 0 ? makeTable(
          ['Group', 'Parity Difference', 'Parity %', 'Status'],
          sp.map(r => [
            r.group,
            String(r.parityDiff ?? '—'),
            `${r.parityPercent ?? '—'}%`,
            r.favoredOrDisadvantaged ?? '—',
          ])
        ) : body('No statistical parity data available.'),
        divider(),
        new Paragraph({ children: [new PageBreak()] }),

        // ── EQUAL OPPORTUNITY ─────────────────────────────────────────────
        headerPara('5. Equal Opportunity Analysis'),
        subHead('True Positive Rate by Group'),
        body('Equal opportunity analysis measures whether qualified individuals from each group have an equal chance of being selected (true positive rate comparison).'),
        new Paragraph({ spacing: { after: 160 } }),
        eo.length > 0 ? makeTable(
          ['Group', 'True Positive Rate', 'Opportunity Gap', 'Flag'],
          eo.map(r => [
            r.group,
            `${r.truePositiveRate ?? '—'}%`,
            `${r.equalOpportunityGap ?? '—'}%`,
            r.flag ? '⚠ Flagged' : '✓ Clear',
          ])
        ) : body('No equal opportunity data available.'),
        divider(),

        // ── FEATURE CORRELATION ───────────────────────────────────────────
        headerPara('6. Feature Bias Correlation (Proxy Variable Detection)'),
        subHead('Correlation with Protected Attributes'),
        body('This section identifies features that may act as proxies for protected characteristics (e.g., ZIP code as a proxy for race), which can introduce indirect bias even when no protected attributes are directly used.'),
        new Paragraph({ spacing: { after: 160 } }),
        fc.length > 0 ? makeTable(
          ['Feature', 'Correlation', 'Bias Risk', 'Recommendation'],
          fc.map(r => [
            r.feature,
            `${Math.round((r.correlation ?? 0) * 100)}%`,
            r.biasRisk ?? '—',
            r.recommendation ?? '—',
          ])
        ) : body('No feature correlation data available.'),
        divider(),
        new Paragraph({ children: [new PageBreak()] }),

        // ── METHODOLOGY ───────────────────────────────────────────────────
        headerPara('7. Methodology & Disclaimer'),
        body('This audit was conducted using multi-page SPA (Single Page Application) crawling via Puppeteer, followed by AI-powered content analysis using Google Gemini. The crawler visits the landing page and up to 3 internal pages (careers, terms, about, privacy) to gather comprehensive textual and form-field evidence.'),
        body('The resulting data is analyzed by Gemini AI using a structured fairness audit prompt that evaluates: demographic language bias, proxy variable usage, form field analysis, and slogans/messaging patterns.'),
        body('Note: This automated audit is intended as a first-pass screening tool. Results should be validated by a qualified human ethics compliance officer before making any consequential decisions.', true),
        divider(),

        // ── FOOTER ────────────────────────────────────────────────────────
        new Paragraph({
          children: [new TextRun({ text: `Generated by UnbiasNet • Powered by ${modelUsed || 'Gemini AI'} • ${date}`, size: 16, color: '999999' })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
        }),
      ],
    }],
  });

  const blob     = await Packer.toBlob(doc);
  const hostname = (() => { try { return new URL(url).hostname; } catch { return 'site'; } })();
  const filename = `UnbiasNet_Report_${hostname}_${new Date().toISOString().slice(0, 10)}.docx`;
  saveAs(blob, filename);
}
