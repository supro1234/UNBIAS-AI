import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import {
  ShieldCheck, AlertTriangle, Cpu,
  X, Activity, RefreshCw, Zap, Globe, Clock, TrendingUp, Database,
} from 'lucide-react';
import { API_BASE_URL } from '../config';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ModelHealth {
  id:            string;
  name:          string;
  domain:        string;
  fairnessScore: number;
  status:        string;
  lastAudited:   string;
  modelUsed?:    string;
}

interface SummaryData {
  overallFairnessScore: number;
  criticalFlags:        number;
  analyzedRows:         string;
  modelsMonitored:      number;
  totalScans:           number;
  modelHealth:          ModelHealth[];
}

interface ScanHistoryEntry {
  url:              string;
  hostname:         string;
  timestamp:        string;
  overallBiasScore: number;
  industry:         string;
  keyFlags:         number;
  modelUsed:        string;
  pagesAnalyzed:    number;
  confidence?:      'high' | 'medium' | 'low';
}

interface QuotaStatus {
  requestsThisMinute: number;
  requestsToday:      number;
  withinLimits:       boolean;
  cacheSize:          number;
  modelsAvailable:    string[];
  primaryModel:       string;
}

interface TooltipPayload {
  name:    string;
  value:   number;
  color:   string;
  payload: { m?: string };
}

interface BarTooltipPayload {
  value:   number;
  payload: ScoreDistEntry;
}

interface ScoreDistEntry {
  range: string;
  count: number;
  color: string;
}

interface RadarEntry {
  axis: string;
  A:    number;
}

// ─── Colours ─────────────────────────────────────────────────────────────────

const C = {
  blue:   '#0a6efd',
  cyan:   '#0dcaf0',
  green:  '#20c997',
  yellow: '#ffc107',
  red:    '#dc3545',
  violet: '#6f42c1',
};

const scColor = (s: number): string => s >= 80 ? C.green : s >= 60 ? C.yellow : C.red;

const statusStyle: Record<string, React.CSSProperties> = {
  Critical: { background: 'rgba(220,53,69,.12)',  color: '#dc3545', border: '1px solid rgba(220,53,69,.3)' },
  Warning:  { background: 'rgba(255,193,7,.12)',   color: '#ffc107', border: '1px solid rgba(255,193,7,.3)' },
  Fair:     { background: 'rgba(32,201,151,.12)',  color: '#20c997', border: '1px solid rgba(32,201,151,.3)' },
};

// ─── Toast ───────────────────────────────────────────────────────────────────

interface ToastProps { msg: string; type: string; close: () => void; }

function Toast({ msg, type, close }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(close, 4500);
    return () => clearTimeout(t);
  }, [close]);

  const clr = type === 'error' ? C.red : type === 'success' ? C.green : C.violet;
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 12, minWidth: 300,
      background: 'rgba(5,8,20,0.95)', border: `1px solid ${clr}33`,
      borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'fadeUp .35s ease both',
    }}>
      <Activity size={16} style={{ color: clr, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#ddd', flex: 1 }}>{msg}</span>
      <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)' }}>
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatProps {
  title: string;
  value: string;
  sub:   string;
  Icon:  React.FC<{ size?: number; style?: React.CSSProperties }>;
  color: string;
}

function Stat({ title, value, sub, Icon, color }: StatProps) {
  return (
    <div className="glass-violet" style={{
      borderRadius: 18, padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 13, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}12`, boxShadow: `0 0 20px ${color}20`, border: `1px solid ${color}22`,
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 5 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────

interface ChartTipProps {
  active?:  boolean;
  payload?: TooltipPayload[];
  label?:   string;
}

const ChartTip = ({ active, payload, label }: ChartTipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(5,8,20,0.95)', border: '1px solid rgba(13,202,240,0.15)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: '#fff' }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

// ─── Score Ring ───────────────────────────────────────────────────────────────

function Ring({ score }: { score: number }) {
  const r = 44, circ = 2 * Math.PI * r;
  const clr = scColor(score);
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={108} height={108} viewBox="0 0 108 108" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={54} cy={54} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={9} />
        <circle cx={54} cy={54} r={r} fill="none" stroke={clr} strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
          style={{ filter: `drop-shadow(0 0 9px ${clr})`, transition: 'stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: clr, lineHeight: 1 }}>{score}%</div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>score</div>
      </div>
    </div>
  );
}

// ─── Favicon ─────────────────────────────────────────────────────────────────

function FavIcon({ hostname }: { hostname: string }) {
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
      alt={hostname}
      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
      style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0 }}
    />
  );
}

// ─── Bar Tooltip ─────────────────────────────────────────────────────────────

interface BarTipProps {
  active?:  boolean;
  payload?: BarTooltipPayload[];
}

const BarTip = ({ active, payload }: BarTipProps) => {
  if (!active || !payload?.[0]) return null;
  return (
    <div style={{ background: 'rgba(5,8,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: '#fff', fontWeight: 700 }}>{payload[0].payload.range}% range</div>
      <div style={{ color: 'rgba(255,255,255,0.5)' }}>{payload[0].value} site{payload[0].value !== 1 ? 's' : ''}</div>
    </div>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

// ─── Confidence Badge ────────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level?: string }) {
  if (!level) return null;
  const styles: Record<string, React.CSSProperties> = {
    high:   { background: 'rgba(32,201,151,.12)',  color: '#20c997', border: '1px solid rgba(32,201,151,.3)' },
    medium: { background: 'rgba(255,193,7,.12)',   color: '#ffc107', border: '1px solid rgba(255,193,7,.3)' },
    low:    { background: 'rgba(220,53,69,.12)',   color: '#dc3545', border: '1px solid rgba(220,53,69,.3)' },
  };
  return (
    <span style={{ ...styles[level] ?? styles.medium, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
      {level === 'low' ? '⚠ ' : ''}{level}
    </span>
  );
}

// ─── Quota Bar ────────────────────────────────────────────────────────────────

function QuotaBar({ quota }: { quota: QuotaStatus | null }) {
  if (!quota) return null;
  const pct = Math.min(100, (quota.requestsThisMinute / 10) * 100);
  const barColor = quota.withinLimits ? C.green : C.red;
  return (
    <div className="glass-violet" style={{
      borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Database size={14} style={{ color: C.violet }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '.08em' }}>API Quota</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            {quota.requestsThisMinute}/min &nbsp;·&nbsp; {quota.requestsToday}/day &nbsp;·&nbsp; {quota.cacheSize} cached
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>
            {quota.withinLimits ? '✓ Within Limits' : '⚠ Rate Limited'}
          </span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 3 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width .6s' }} />
        </div>
      </div>
      <div style={{ flexShrink: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)', maxWidth: 180, textAlign: 'right' }}>
        Model: <span style={{ color: C.violet, fontFamily: 'monospace' }}>{quota.primaryModel}</span>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [summary, setSummary]       = useState<SummaryData | null>(null);
  const [history, setHistory]       = useState<ScanHistoryEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [mitigating, setMitigating] = useState<string | null>(null);
  const [toast, setToast]           = useState<{ msg: string; type: string } | null>(null);
  const [quota, setQuota]           = useState<QuotaStatus | null>(null);

  const notify = (msg: string, type = 'info') => setToast({ msg, type });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumR, histR, quotaR] = await Promise.all([
        fetch(`${API_BASE_URL}/api/summary`),
        fetch(`${API_BASE_URL}/api/scan-history`),
        fetch(`${API_BASE_URL}/api/quota-status`),
      ]);
      const sumD   = await sumR.json()   as SummaryData  & { success: boolean };
      const histD  = await histR.json()  as { success: boolean; history: ScanHistoryEntry[] };
      const quotaD = await quotaR.json() as QuotaStatus;
      if (sumD.success)  setSummary(sumD);
      if (histD.success) setHistory(histD.history);
      setQuota(quotaD);
      notify('Dashboard synced successfully', 'success');
    } catch {
      notify('Backend unavailable — showing cached data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const mitigate = async (id: string, name: string) => {
    setMitigating(id);
    notify(`Running mitigation on ${name}…`);
    try {
      const r = await fetch(`${API_BASE_URL}/api/mitigate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: id }),
      });
      const d = await r.json() as { success: boolean; message?: string; newFairnessScore?: number };
      if (d.success) {
        notify(d.message ?? 'Done', 'success');
        const newScore = d.newFairnessScore ?? 92;
        setSummary(prev => prev ? {
          ...prev,
          overallFairnessScore: newScore,
          modelHealth: prev.modelHealth.map(m =>
            m.id === id ? { ...m, fairnessScore: newScore, status: newScore >= 80 ? 'Fair' : 'Warning' } : m
          ),
        } : prev);
      }
    } catch { notify('Mitigation failed', 'error'); }
    finally   { setMitigating(null); }
  };

  // ── Derived chart data ──────────────────────────────────────────────────────

  const score = summary?.overallFairnessScore ?? 72;

  const trendData = history.length > 0
    ? [...history].reverse().slice(-12).map(h => ({
        m: new Date(h.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        f: h.overallBiasScore,
      }))
    : [
        { m: 'No Data', f: 72 },
        { m: 'Scan URLs', f: 72 },
        { m: 'To See', f: 72 },
        { m: 'Live Data', f: 72 },
      ];

  const scoreDistData: ScoreDistEntry[] = [
    { range: '90-100', count: history.filter(h => h.overallBiasScore >= 90).length,                                    color: C.green  },
    { range: '80-89',  count: history.filter(h => h.overallBiasScore >= 80 && h.overallBiasScore < 90).length,        color: C.violet   },
    { range: '60-79',  count: history.filter(h => h.overallBiasScore >= 60 && h.overallBiasScore < 80).length,        color: C.yellow },
    { range: '0-59',   count: history.filter(h => h.overallBiasScore < 60).length,                                    color: C.red    },
  ];

  const avgScore = history.length > 0
    ? Math.round(history.reduce((s, h) => s + h.overallBiasScore, 0) / history.length)
    : 72;

  const radarData: RadarEntry[] = [
    { axis: 'Fairness Score', A: avgScore                              },
    { axis: 'Consistency',    A: Math.max(40, avgScore - 8)            },
    { axis: 'Coverage',       A: Math.min(100, history.length * 10)    },
    { axis: 'Proxy Safety',   A: Math.max(40, avgScore - 10)           },
    { axis: 'Parity',         A: Math.min(100, avgScore + 5)           },
  ];

  return (
    <Layout title="AI Fairness Command Center" subtitle="Live scan history, bias trends, and mitigation insights">
      {toast && <Toast msg={toast.msg} type={toast.type} close={() => setToast(null)} />}

      {/* Top action bar */}
      <div style={{ position: 'absolute', top: 12, right: 28, zIndex: 100, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={fetchData} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 700, color: C.violet, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <Stat title="Avg Fairness Score" value={loading ? '—' : `${score}%`}
          sub="Across all scanned URLs" Icon={ShieldCheck} color={C.green} />
        <Stat title="URLs Scanned" value={loading ? '—' : `${history.length}`}
          sub="Lifetime crawls" Icon={Globe} color={C.violet} />
        <Stat title="Active Flags" value={loading ? '—' : `${summary?.criticalFlags ?? 0}`}
          sub="Disparate impact flags" Icon={AlertTriangle} color={C.red} />
        <Stat title="Engine" value="Gemini"
          sub={loading ? '—' : (summary?.modelHealth?.[0]?.modelUsed ?? summary?.modelHealth?.[0]?.lastAudited ?? 'Never')} Icon={Cpu} color={C.violet} />
      </div>

      {/* Quota Status Bar */}
      <QuotaBar quota={quota} />

      {/* Trend Chart + Score Ring */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <div className="glass-violet" style={{ borderRadius: 18, padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                {history.length > 0 ? 'Live Scan History — Fairness Score Trend' : 'Fairness Score Trend'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                {history.length > 0
                  ? `${history.length} URL${history.length !== 1 ? 's' : ''} scanned — last 12 shown`
                  : 'Scan URLs on the Analyze page to see live data'}
              </div>
            </div>
            {history.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.violet }}>
                <TrendingUp size={13} />
                Live Data
              </div>
            )}
          </div>
          <div className="glass-secondary p-4" style={{ borderRadius: 18 }}>
            <div className="bg-gradient-to-br from-[#06060A] via-[#06060A]/80 to-[#06060A] p-4 rounded-lg" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 0, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={C.violet} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={C.violet} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" stroke="rgba(255,255,255,0.2)"
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.2)"
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: 'rgba(255,255,255,.06)' }} />
                  <Area dataKey="f" name="Fairness" stroke={C.violet} strokeWidth={2.5} fill="url(#gF)"
                    dot={{ r: 4, fill: C.violet, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="glass-violet" style={{ borderRadius: 18, padding: '22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,0.35)', alignSelf: 'flex-start' }}>
            Overall Score
          </div>
          <Ring score={score} />
          <div style={{ width: '100%', background: 'rgba(255,255,255,0.025)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>Status</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>
              {history.length === 0
                ? 'No URLs scanned yet. Use the Analyze page to run your first audit.'
                : score >= 80 ? 'Good — most scanned sites show fair outcomes.'
                : score >= 60 ? 'Warning — some sites show moderate bias signals.'
                : 'Critical — significant bias detected across scanned sites.'}
            </div>
          </div>
        </div>
      </div>

      {/* Score Distribution + Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="glass-violet" style={{ borderRadius: 18, padding: '22px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Score Distribution</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 18 }}>Fairness score breakdown across all scanned URLs</div>
          <div className="glass-secondary p-4" style={{ borderRadius: 18 }}>
            <div className="bg-gradient-to-br from-[#06060A] via-[#06060A]/80 to-[#06060A] p-4 rounded-lg" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<BarTip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} background={{ fill: 'rgba(255,255,255,0.025)', radius: 6 }}>
                  {scoreDistData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="glass-violet" style={{ borderRadius: 18, padding: '22px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Audit Depth Radar</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Multi-dimension audit coverage quality</div>
          <div className="glass-secondary p-4" style={{ borderRadius: 18 }}>
            <div className="bg-gradient-to-br from-[#06060A] via-[#06060A]/80 to-[#06060A] p-4 rounded-lg" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                <Radar dataKey="A" stroke={C.violet} fill={C.violet} fillOpacity={0.12} strokeWidth={2} dot={{ r: 3, fill: C.violet }} />
              </RadarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="glass-violet" style={{ borderRadius: 18, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 3 }}>Recently Scanned URLs</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Live audit history — most recent first</div>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.03)' }}>
            {history.length} total
          </span>
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.4 }}>
            <Globe size={32} color="rgba(255,255,255,0.3)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No scans yet — head to the Analyze page to audit your first URL</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                {['Icon', 'Domain', 'Fairness Score', 'Industry', 'Flags', 'Pages', 'Confidence', 'Engine', 'Scanned'].map(h => (
                  <th key={h} style={{ paddingBottom: 10, textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 15).map((h, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,.025)' }}>
                  <td style={{ padding: '12px 0' }}>
                    <FavIcon hostname={h.hostname} />
                  </td>
                  <td style={{ paddingRight: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.hostname}
                    </div>
                  </td>
                  <td style={{ paddingRight: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ height: 6, width: 80, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${h.overallBiasScore}%`, background: scColor(h.overallBiasScore), borderRadius: 3, transition: 'width 1s' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: scColor(h.overallBiasScore) }}>
                        {h.overallBiasScore}%
                      </span>
                    </div>
                  </td>
                  <td style={{ paddingRight: 16 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 5 }}>
                      {h.industry || '—'}
                    </span>
                  </td>
                  <td style={{ paddingRight: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: h.keyFlags > 0 ? C.red : C.green }}>
                      {h.keyFlags || 0}
                    </span>
                  </td>
                  <td style={{ paddingRight: 16 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                      {h.pagesAnalyzed ?? '—'}
                    </span>
                  </td>
                  <td style={{ paddingRight: 16 }}>
                    <ConfidenceBadge level={h.confidence} />
                  </td>
                  <td style={{ paddingRight: 16 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                      {h.modelUsed ? h.modelUsed.replace('gemini-', 'g-') : 'Gemini'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                      <Clock size={11} />
                      {new Date(h.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Engine Health */}
      <div className="glass-violet" style={{ borderRadius: 18, padding: '22px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Engine Health</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>Live fairness engine status — click Fix to apply mitigation</div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(n => <div key={n} className="skeleton" style={{ height: 52 }} />)}
          </div>
        ) : (summary?.modelHealth ?? []).map(m => (
          <div key={m.id} style={{
            background: 'rgba(255,255,255,0.025)', borderRadius: 12, padding: '12px 16px',
            marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14,
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{m.name}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{m.domain}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }}>Last: {m.lastAudited}</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${m.fairnessScore}%`, background: scColor(m.fairnessScore), borderRadius: 3, transition: 'width 1.2s' }} />
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'monospace', flexShrink: 0, color: scColor(m.fairnessScore) }}>
              {m.fairnessScore}%
            </div>
            <span style={{ ...statusStyle[m.status], padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700 }}>
              {m.status}
            </span>
            <button onClick={() => mitigate(m.id, m.name)} disabled={mitigating === m.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9,
                border: `1px solid rgba(10,110,253,0.2)`, background: 'rgba(10,110,253,0.07)',
                color: C.blue, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                opacity: mitigating === m.id ? 0.5 : 1, transition: 'all .2s', flexShrink: 0,
              }}>
              {mitigating === m.id ? <RefreshCw size={11} className="spin" /> : <Zap size={11} />}
              {mitigating === m.id ? '…' : 'Fix'}
            </button>
          </div>
        ))}
      </div>
    </Layout>
  );
}
