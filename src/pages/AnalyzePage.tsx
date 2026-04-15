import React, { useCallback, useState } from 'react';
import Layout from '../components/Layout';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ScatterChart, Scatter, ZAxis, ReferenceLine,
} from 'recharts';
import {
  Play, RefreshCw, Globe, Activity, AlertTriangle,
  Search, ShieldCheck, Cpu, Download, CheckCircle, FileText,
  Layers,
} from 'lucide-react';
import { downloadAuditReport } from '../utils/generateReport';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DisparateImpactRow {
  group: string;
  acceptanceRate?: number;
  impactRatio?: number;
  severity?: string;
  total?: number;
  disparateImpactFlag?: boolean;
}

interface FeatureCorrelationRow {
  feature: string;
  correlation?: number;
  biasRisk?: string;
  recommendation?: string;
}

interface EqualOpportunityRow {
  group: string;
  truePositiveRate?: number;
  equalOpportunityGap?: number;
  flag?: boolean;
}

interface StatisticalParityRow {
  group: string;
  parityDiff?: number;
  parityPercent?: number;
  favoredOrDisadvantaged?: string;
}

interface AuditResult {
  overallBiasScore?: number;
  aiReasoning?: string;
  recommendation?: string;
  modelUsed?: string;
  timestamp?: string;
  screenshot?: string;
  industry?: string;
  pagesAnalyzed?: number;
  keyFindings?: string[];
  confidence?: 'high' | 'medium' | 'low';
  confidenceWarning?: string;
  fromCache?: boolean;
  crawledUrls?: string[];
  analysisResults?: {
    disparateImpact?:    DisparateImpactRow[];
    featureCorrelation?: FeatureCorrelationRow[];
    equalOpportunity?:   EqualOpportunityRow[];
    statisticalParity?:  StatisticalParityRow[];
  };
}

// ─── Colour helpers ──────────────────────────────────────────────────────────

const C = {
  blue:   '#0a6efd',
  cyan:   '#0dcaf0',
  green:  '#20c997',
  yellow: '#ffc107',
  red:    '#dc3545',
  violet: '#6f42c1',
};

const sc = (s: number | null): string => {
  if (s === null) return 'rgba(255,255,255,0.2)';
  return s >= 80 ? C.green : s >= 60 ? C.yellow : C.red;
};

const statusStyle: Record<string, React.CSSProperties> = {
  Critical: { background: 'rgba(220,53,69,.12)',  color: '#dc3545', border: '1px solid rgba(220,53,69,.3)' },
  Warning:  { background: 'rgba(255,193,7,.12)',   color: '#ffc107', border: '1px solid rgba(255,193,7,.3)' },
  Fair:     { background: 'rgba(32,201,151,.12)',  color: '#20c997', border: '1px solid rgba(32,201,151,.3)' },
  High:     { background: 'rgba(220,53,69,.12)',   color: '#dc3545', border: '1px solid rgba(220,53,69,.3)' },
  Medium:   { background: 'rgba(255,193,7,.12)',   color: '#ffc107', border: '1px solid rgba(255,193,7,.3)' },
  Low:      { background: 'rgba(32,201,151,.12)',  color: '#20c997', border: '1px solid rgba(32,201,151,.3)' },
};

// ─── Scan Progress ────────────────────────────────────────────────────────────

const STAGES = [
  { key: 'crawling',  Icon: Globe,        label: 'SPA Crawler Mapping Pages',  sub: 'Headless browser rendering up to 4 pages...' },
  { key: 'analyzing', Icon: Cpu,          label: 'Gemini AI Deep Analysis',     sub: 'Running fairness audit pipeline...' },
  { key: 'building',  Icon: FileText,     label: 'Building Report Data',        sub: 'Structuring analysis results...' },
  { key: 'done',      Icon: CheckCircle,  label: 'Audit Complete',              sub: 'Report ready for review' },
];

function ScanProgress({ stage }: { stage: string }) {
  const idx = STAGES.findIndex(s => s.key === stage);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, padding: '60px 0' }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width={140} height={140} viewBox="0 0 140 140" style={{ position: 'absolute', inset: 0 }}>
          <circle cx={70} cy={70} r={60} fill="none" stroke="rgba(10,110,253,0.08)" strokeWidth={3} />
          <circle cx={70} cy={70} r={60} fill="none" stroke={C.cyan} strokeWidth={3}
            strokeLinecap="round" strokeDasharray="60 318"
            style={{ transformOrigin: '70px 70px', animation: 'spin 1.4s linear infinite' }}
          />
          <circle cx={70} cy={70} r={46} fill="none" stroke="rgba(13,202,240,0.15)" strokeWidth={1.5} />
          <circle cx={70} cy={70} r={32} fill="rgba(10,110,253,0.06)" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Globe size={32} color={C.cyan} style={{ animation: 'pulse 2s ease-in-out infinite' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 500 }}>
        {STAGES.map((s, i) => {
          const done   = i < idx;
          const active = i === idx;
          const { Icon } = s;
          return (
            <div key={s.key} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '14px 20px', borderRadius: 14,
              background: active ? 'rgba(10,110,253,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${active ? 'rgba(13,202,240,0.3)' : done ? 'rgba(32,201,151,0.2)' : 'rgba(255,255,255,0.05)'}`,
              transition: 'all 0.4s',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: done ? 'rgba(32,201,151,0.12)' : active ? 'rgba(10,110,253,0.12)' : 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${done ? 'rgba(32,201,151,0.3)' : active ? 'rgba(13,202,240,0.3)' : 'transparent'}`,
              }}>
                {done
                  ? <CheckCircle size={16} color={C.green} />
                  : <Icon size={16} color={active ? C.cyan : 'rgba(255,255,255,0.25)'} className={active ? 'spin' : ''} />
                }
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: active ? '#fff' : done ? C.green : 'rgba(255,255,255,0.35)' }}>
                  {s.label}
                </div>
                {active && <div style={{ fontSize: 11, color: 'rgba(13,202,240,0.7)', marginTop: 3 }}>{s.sub}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 54, circ = 2 * Math.PI * r;
  const clr = sc(score);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={124} height={124} viewBox="0 0 124 124" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={62} cy={62} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={10} />
        <circle cx={62} cy={62} r={r} fill="none" stroke={clr} strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
          style={{ filter: `drop-shadow(0 0 10px ${clr})`, transition: 'stroke-dasharray 1.6s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: clr, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
          fairness
        </div>
      </div>
    </div>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipPayload {
  value: number;
  name: string;
  payload: { name?: string };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  extra?: string;
}

const CustomTip = ({ active, payload, extra = '' }: ChartTooltipProps) => {
  if (!active || !payload?.[0]) return null;
  return (
    <div style={{ background: 'rgba(5,8,18,0.95)', border: '1px solid rgba(13,202,240,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 800, color: '#fff', marginBottom: 4 }}>{payload[0].payload?.name ?? payload[0].name}</div>
      <div style={{ color: 'rgba(255,255,255,0.6)' }}>{payload[0].value}{extra}</div>
    </div>
  );
};

// ─── Chart data types ─────────────────────────────────────────────────────────

interface FcChartItem {
  name: string;
  val:  number;
  color: string;
  rec:  string;
  risk: string;
}

interface ScatterItem {
  x: number;
  y: number;
  z: number;
  name: string;
  color: string;
}

interface RadarItem {
  axis: string;
  A:    number;
}

// ScatterDot — extracted component so recharts shape prop types resolve correctly
function ScatterDot(props: { cx?: number; cy?: number; payload?: ScatterItem }) {
  const { cx = 0, cy = 0, payload } = props;
  return (
    <circle
      cx={cx} cy={cy} r={8}
      fill={payload?.color ?? C.cyan}
      fillOpacity={0.7}
      stroke={payload?.color ?? C.cyan}
      strokeWidth={1.5}
    />
  );
}

// FeatureCorrelationTooltip — extracted for type safety
interface FcTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: FcChartItem }>;
}

function FeatureCorrelationTooltip({ active, payload }: FcTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div style={{
      background: 'rgba(5,8,18,0.95)',
      border: '1px solid rgba(13,202,240,0.2)',
      borderRadius: 10,
      padding: '10px 14px',
      maxWidth: 240
    }}>
      <div style={{ fontWeight: 800, color: '#fff', marginBottom: 6 }}>
        {payload[0].value}% Correlation
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
        {data.rec}
      </div>
      <span style={{
        ...statusStyle[data.risk || 'Low'],
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        marginTop: 8,
        display: 'inline-block'
      }}>
        {data.risk} Risk
      </span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props { apiKey: string; }

// ─── Component ───────────────────────────────────────────────────────────────

export default function AnalyzePage({ apiKey }: Props) {
  const [url, setUrl]           = useState('');
  const [running, setRunning]   = useState(false);
  const [results, setResults]   = useState<AuditResult | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [elapsed, setElapsed]   = useState<number | null>(null);
  const [stage, setStage]       = useState('idle');
  const [downloading, setDownloading] = useState(false);

  const runLiveAudit = useCallback(async () => {
    if (!url) { setError('Please enter a target URL'); return; }
    if (!url.startsWith('http')) { setError('URL must start with http:// or https://'); return; }

    setRunning(true); setResults(null); setError(null); setStage('crawling');
    const t0 = Date.now();

    const t1 = setTimeout(() => setStage('analyzing'), 5000);
    const t2 = setTimeout(() => setStage('building'),  10000);

    try {
      const r = await fetch('http://localhost:3001/api/live-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, apiKey }),
      });

      const d: AuditResult & { success: boolean; error?: string } = await r.json();
      if (d.success) {
        clearTimeout(t1); clearTimeout(t2);
        setStage('done');
        setTimeout(() => { setResults(d); setElapsed(Date.now() - t0); }, 600);
      } else {
        setError(d.error || 'The audit pipeline failed.');
      }
    } catch {
      setError('Could not reach the audit server. Ensure the backend is running on port 3001.');
    } finally {
      setRunning(false); setStage('idle');
    }
  }, [url, apiKey]);

  const handleDownload = async () => {
    if (!results) return;
    setDownloading(true);
    try { await downloadAuditReport(results, url); }
    finally { setDownloading(false); }
  };

  const di    = results?.analysisResults?.disparateImpact    ?? [];
  const fc    = results?.analysisResults?.featureCorrelation ?? [];
  const eo    = results?.analysisResults?.equalOpportunity   ?? [];
  const sp    = results?.analysisResults?.statisticalParity  ?? [];
  const score = results?.overallBiasScore ?? null;

  // ── Derived chart data ─────────────────────────────────────────────────────

  const fcChart: FcChartItem[] = fc.map(f => ({
    name:  f.feature.length > 16 ? f.feature.slice(0, 16) + '…' : f.feature,
    val:   Math.round((f.correlation ?? 0) * 100),
    color: f.biasRisk === 'High' ? C.red : f.biasRisk === 'Medium' ? C.yellow : C.green,
    rec:   f.recommendation ?? '',
    risk:  f.biasRisk ?? 'Low',
  }));

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 50;

  const radarData: RadarItem[] = [
    { axis: 'Disparate Impact',   A: Math.round(avg(di.map(r => (r.impactRatio ?? 1) * 100))) },
    { axis: 'Equal Opportunity',  A: Math.max(0, 100 - Math.round(avg(eo.map(r => (r.equalOpportunityGap ?? 0) * 4)))) },
    { axis: 'Statistical Parity', A: Math.max(0, 100 - Math.round(avg(sp.map(r => (r.parityPercent ?? 0) * 2)))) },
    { axis: 'Feature Proxies',    A: Math.max(0, 100 - Math.round(avg(fc.map(r => (r.correlation ?? 0) * 80)))) },
  ];

  const scatterData: ScatterItem[] = di.map(r => ({
    x:     r.acceptanceRate ?? 0,
    y:     Math.round((r.impactRatio ?? 1) * 100),
    z:     r.total ?? 50,
    name:  r.group,
    color: r.severity === 'Critical' ? C.red : r.severity === 'Warning' ? C.yellow : C.green,
  }));

  return (
    <Layout
      title="Link Fairness Auditor"
      subtitle="Paste any URL — Gemini AI will crawl, analyze, and generate a full bias report"
    >
      {/* ── URL INPUT ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(10,110,253,0.04)', border: '1px solid rgba(13,202,240,0.15)',
        borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="rgba(13,202,240,0.5)" style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text" value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runLiveAudit()}
            placeholder="https://target-website.com — press Enter or click Audit"
            disabled={running}
            style={{
              width: '100%', padding: '16px 18px 16px 52px', borderRadius: 14,
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
              color: '#fff', fontSize: 15, outline: 'none', transition: 'all 0.25s',
              fontFamily: 'monospace', boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          id="start-audit-btn"
          onClick={runLiveAudit} disabled={running || !url}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '16px 36px', borderRadius: 14,
            background: running ? 'rgba(10,110,253,0.2)' : `linear-gradient(135deg, ${C.blue}, ${C.violet})`,
            color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer',
            boxShadow: running ? 'none' : '0 8px 32px rgba(10,110,253,0.4)',
            opacity: (running || !url) ? 0.6 : 1, transition: 'all 0.3s', flexShrink: 0,
          }}
        >
          {running ? <RefreshCw size={18} className="spin" /> : <Play size={18} />}
          {running ? 'Auditing…' : 'Audit URL'}
        </button>
      </div>

      {/* ── ERROR ─────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
          background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.25)',
          borderRadius: 14, color: C.red, fontSize: 13,
        }}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* ── SCAN PROGRESS ─────────────────────────────────────────────────── */}
      {running && <ScanProgress stage={stage} />}

      {/* ── RESULTS ───────────────────────────────────────────────────────── */}
      {results && !running && score !== null && (
        <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {([
              { label: 'Fairness Score', value: `${score}%`,                                       sub: score >= 80 ? 'Fair' : score >= 60 ? 'Warning' : 'Critical', Icon: ShieldCheck, color: sc(score)  },
              { label: 'Pages Audited',  value: String(results.pagesAnalyzed ?? 'Deep'),           sub: 'SPA-crawled',        Icon: Layers,        color: C.cyan   },
              { label: 'Bias Flags',     value: String(di.filter(r => r.disparateImpactFlag).length), sub: 'Disparate impact',   Icon: AlertTriangle, color: C.yellow },
              { label: 'Analysis Time',  value: `${(((elapsed ?? 0)) / 1000).toFixed(1)}s`,        sub: 'Full pipeline',      Icon: Activity,      color: C.violet },
            ] as const).map(({ label, value, sub, Icon, color }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}14`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Reasoning + Score Ring + Download */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 18 }}>
            <div style={{ background: 'rgba(10,110,253,0.04)', border: '1px solid rgba(13,202,240,0.18)', borderRadius: 18, padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Cpu size={18} color={C.cyan} />
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: C.cyan }}>
                  Gemini AI Deep Research Insights
                </span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {results.fromCache && (
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, background: 'rgba(111,66,193,0.15)', color: '#6f42c1', border: '1px solid rgba(111,66,193,0.3)' }}>
                      ⚡ Cache
                    </span>
                  )}
                  {results.confidence && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6,
                      ...(results.confidence === 'high'
                        ? { background: 'rgba(32,201,151,0.12)', color: '#20c997', border: '1px solid rgba(32,201,151,0.3)' }
                        : results.confidence === 'medium'
                        ? { background: 'rgba(255,193,7,0.12)',  color: '#ffc107', border: '1px solid rgba(255,193,7,0.3)' }
                        : { background: 'rgba(220,53,69,0.12)',  color: '#dc3545', border: '1px solid rgba(220,53,69,0.3)' })
                    }}>
                      {results.confidence === 'low' ? '⚠ ' : ''}Confidence: {results.confidence}
                    </span>
                  )}
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, background: 'rgba(13,202,240,0.1)', color: C.cyan }}>
                    {results.modelUsed || 'Gemini AI'}
                  </span>
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.85, margin: 0, fontStyle: 'italic' }}>
                "{results.aiReasoning}"
              </p>
              {results.confidenceWarning && (
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(220,53,69,0.07)', border: '1px solid rgba(220,53,69,0.22)' }}>
                  <AlertTriangle size={15} color="#dc3545" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{results.confidenceWarning}</span>
                </div>
              )}
              {results.industry && (
                <div style={{ marginTop: 14, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  Industry: <strong style={{ color: C.cyan }}>{results.industry}</strong>
                </div>
              )}
              {(results.keyFindings?.length ?? 0) > 0 && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {results.keyFindings!.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                      <span style={{ color: C.cyan, marginTop: 2, flexShrink: 0 }}>◆</span>
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,0.4)' }}>
                Overall Score
              </div>
              <ScoreRing score={score} />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.5 }}>
                {results.recommendation}
              </div>
              <button
                id="download-docx-btn"
                onClick={handleDownload} disabled={downloading}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 0', borderRadius: 12,
                  background: `linear-gradient(135deg, rgba(32,201,151,0.15), rgba(10,110,253,0.15))`,
                  border: `1px solid rgba(32,201,151,0.25)`, color: C.green,
                  fontSize: 13, fontWeight: 700, cursor: downloading ? 'default' : 'pointer',
                  opacity: downloading ? 0.6 : 1, transition: 'all 0.3s',
                }}
              >
                {downloading ? <RefreshCw size={15} className="spin" /> : <Download size={15} />}
                {downloading ? 'Generating…' : 'Download DOCX Report'}
              </button>
            </div>
          </div>

          {/* Verification Screenshot */}
          {results.screenshot && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', padding: '4px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.7)', color: C.cyan, border: '1px solid rgba(13,202,240,0.3)' }}>
                  Rendered Proof — {(() => { try { return new URL(url).hostname; } catch { return url; } })()}
                </span>
              </div>
              <img
                src={`data:image/webp;base64,${results.screenshot}`}
                alt="Audit Verification"
                style={{ width: '100%', maxHeight: 220, objectFit: 'cover', objectPosition: 'top', display: 'block' }}
              />
            </div>
          )}

          {/* Charts: Radar + Scatter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>Fairness Radar</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 18 }}>Multi-dimension bias overview</div>
              <div style={{ height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} />
                    <Radar dataKey="A" stroke={C.cyan} fill={C.cyan} fillOpacity={0.12} strokeWidth={2} dot={{ r: 4, fill: C.cyan }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>4/5ths Rule Scatter</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 18 }}>Acceptance Rate vs Impact Ratio per group</div>
              <div style={{ height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                    <XAxis type="number" dataKey="x" name="Acceptance %" domain={[0, 100]}
                      tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                      label={{ value: 'Acceptance %', position: 'insideBottom', offset: -2, fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                    />
                    <YAxis type="number" dataKey="y" name="Impact Ratio %" domain={[0, 120]}
                      tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                    />
                    <ZAxis type="number" dataKey="z" range={[40, 200]} />
                    <Tooltip content={<CustomTip extra="%" />} cursor={{ stroke: 'rgba(255,255,255,0.05)' }} />
                    <ReferenceLine y={80} stroke={C.red} strokeDasharray="4 4" strokeWidth={1.5}
                      label={{ value: '80% threshold', fill: C.red, fontSize: 9 }}
                    />
                    <Scatter data={scatterData} shape={<ScatterDot />} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Results Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

            {/* 1. Disparate Impact */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.08em' }}>Disparate Impact</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                    {['Group', 'Rate', 'Ratio', 'Verdict'].map(h => (
                      <th key={h} style={{ paddingBottom: 8, textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {di.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                      <td style={{ padding: '11px 0', fontSize: 13, fontWeight: 600, color: '#fff' }}>{r.group}</td>
                      <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{r.acceptanceRate}%</td>
                      <td style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: (r.impactRatio ?? 1) < 0.8 ? C.red : C.green }}>{r.impactRatio}</td>
                      <td><span style={{ ...statusStyle[r.severity ?? 'Fair'], padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{r.severity}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 2. Feature Correlation Bar Chart */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>Bias Proxy Detection</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 18 }}>Feature correlation with protected attributes</div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fcChart} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      content={<FeatureCorrelationTooltip />}
                    />
                    <Bar dataKey="val" radius={[0, 5, 5, 0]} background={{ fill: 'rgba(255,255,255,0.025)', radius: 5 }}>
                      {fcChart.map((e, cellIdx) => <Cell key={cellIdx} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Equal Opportunity */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.08em' }}>Equal Opportunity Gap</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {eo.map((r, idx) => (
                  <div key={idx} style={{ padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.group}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>TPR: {r.truePositiveRate}%</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: r.flag ? C.red : C.green }}>-{r.equalOpportunityGap}%</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Gap</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Statistical Parity */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.08em' }}>Statistical Parity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sp.map((r, idx) => (
                  <div key={idx} style={{ padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.group}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2, color: r.favoredOrDisadvantaged === 'Favored' ? C.green : C.red, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        {r.favoredOrDisadvantaged}
                      </div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', color: (r.parityDiff ?? 0) > 0 ? C.green : C.red }}>
                      {(r.parityDiff ?? 0) > 0 ? '+' : ''}{r.parityPercent}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom download */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
            <button
              id="download-docx-bottom-btn"
              onClick={handleDownload} disabled={downloading}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '14px 48px', borderRadius: 14,
                background: `linear-gradient(135deg, rgba(32,201,151,0.18), rgba(10,110,253,0.18))`,
                border: `1px solid rgba(32,201,151,0.35)`, color: C.green,
                fontSize: 14, fontWeight: 700, cursor: downloading ? 'default' : 'pointer',
                opacity: downloading ? 0.6 : 1, transition: 'all 0.3s',
                boxShadow: downloading ? 'none' : '0 0 30px rgba(32,201,151,0.12)',
              }}
            >
              {downloading ? <RefreshCw size={16} className="spin" /> : <Download size={16} />}
              {downloading ? 'Generating DOCX…' : 'Download Full Report (.docx)'}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!results && !running && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 80, opacity: 0.5 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, rgba(13,202,240,0.1), transparent)', border: '1px solid rgba(13,202,240,0.2)', marginBottom: 24 }}>
            <Globe size={36} color={C.cyan} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>Ready to Audit</div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', textAlign: 'center', maxWidth: 340, lineHeight: 1.7 }}>
            Enter any website URL above. Gemini AI will crawl the site, detect bias across demographic groups, and generate a downloadable report.
          </p>
        </div>
      )}
    </Layout>
  );
}
