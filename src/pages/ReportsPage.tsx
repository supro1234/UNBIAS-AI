import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Download, Globe, Clock, ShieldCheck, AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { downloadAuditReport } from '../utils/generateReport';

const C = { blue: '#0a6efd', cyan: '#0dcaf0', green: '#20c997', yellow: '#ffc107', red: '#dc3545', violet: '#6f42c1' };

const scColor = (s: number) => s >= 80 ? C.green : s >= 60 ? C.yellow : C.red;

interface ScanEntry {
  url:              string;
  hostname:         string;
  timestamp:        string;
  overallBiasScore: number;
  industry:         string;
  keyFlags:         number;
  modelUsed:        string;
  pagesAnalyzed:    number;
  aiReasoning?:     string;
  recommendation?:  string;
  analysisResults?: object;
}

function FavIcon({ hostname }: { hostname: string }) {
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
      alt={hostname}
      onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      style={{ width: 22, height: 22, borderRadius: 5 }}
    />
  );
}

export default function ReportsPage() {
  const [history, setHistory]       = useState<ScanEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const r = await fetch('http://localhost:3001/api/scan-history');
      const d = await r.json() as { success: boolean; history: ScanEntry[] };
      if (d.success) setHistory(d.history);
    } catch { /* backend not running */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleDownload = async (entry: ScanEntry) => {
    setDownloading(entry.url);
    try {
      await downloadAuditReport(entry, entry.url);
    } finally {
      setDownloading(null);
    }
  };

  const totalScans    = history.length;
  const avgScore      = totalScans > 0 ? Math.round(history.reduce((a, h) => a + h.overallBiasScore, 0) / totalScans) : 0;
  const criticalCount = history.filter(h => h.overallBiasScore < 60).length;
  const fairCount     = history.filter(h => h.overallBiasScore >= 80).length;

  return (
    <Layout title="Audit Reports" subtitle="Download DOCX reports for any previously scanned URL">

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Total Audits',      value: totalScans,     color: C.cyan,   Icon: FileText    },
          { label: 'Avg Fairness',      value: `${avgScore}%`, color: scColor(avgScore), Icon: ShieldCheck },
          { label: 'Critical Sites',    value: criticalCount,  color: C.red,    Icon: AlertTriangle },
          { label: 'Fair Sites',        value: fairCount,      color: C.green,  Icon: ShieldCheck },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color }}>{loading ? '—' : value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
          Scan History
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 400, marginLeft: 10 }}>
            {totalScans} audit{totalScans !== 1 ? 's' : ''} — most recent first
          </span>
        </div>
        <button onClick={fetchHistory} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Empty state */}
      {!loading && history.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', background: 'rgba(255,255,255,0.02)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.05)' }}>
          <FileText size={40} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>No Reports Yet</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            Run your first audit on the Analyze page — results will appear here automatically.
          </div>
        </div>
      )}

      {/* Report cards */}
      {history.map((entry, idx) => (
        <div key={idx} style={{
          background: 'rgba(255,255,255,0.02)', border: `1px solid ${expanded === entry.url ? 'rgba(13,202,240,0.25)' : 'rgba(255,255,255,0.05)'}`,
          borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s',
        }}>
          {/* Row */}
          <div
            onClick={() => setExpanded(expanded === entry.url ? null : entry.url)}
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer' }}
          >
            <FavIcon hostname={entry.hostname} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{entry.hostname}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{entry.url.slice(0, 55)}{entry.url.length > 55 ? '…' : ''}</div>
            </div>

            {/* Score bar */}
            <div style={{ width: 120, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Fairness</span>
                <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'monospace', color: scColor(entry.overallBiasScore) }}>{entry.overallBiasScore}%</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${entry.overallBiasScore}%`, background: scColor(entry.overallBiasScore), borderRadius: 3, transition: 'width 1s' }} />
              </div>
            </div>

            {/* Meta */}
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <Clock size={10} />
                {new Date(entry.timestamp).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{entry.industry || '—'}</div>
            </div>

            {/* Download button */}
            <button
              onClick={e => { e.stopPropagation(); handleDownload(entry); }}
              disabled={downloading === entry.url}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10,
                background: 'rgba(32,201,151,0.08)', border: '1px solid rgba(32,201,151,0.22)',
                color: C.green, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                opacity: downloading === entry.url ? 0.5 : 1, transition: 'all .2s',
              }}>
              {downloading === entry.url ? <RefreshCw size={13} className="spin" /> : <Download size={13} />}
              {downloading === entry.url ? '…' : 'DOCX'}
            </button>
          </div>

          {/* Expanded AI insight */}
          {expanded === entry.url && (
            <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
                Gemini AI Reasoning
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 14 }}>
                "{entry.aiReasoning || 'No reasoning captured.'}"
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
                <div style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Pages crawled: <strong style={{ color: '#fff' }}>{entry.pagesAnalyzed ?? '—'}</strong>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Flags: <strong style={{ color: entry.keyFlags > 0 ? C.red : C.green }}>{entry.keyFlags}</strong>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Engine: <strong style={{ color: C.cyan }}>{entry.modelUsed?.split('-').slice(0,2).join('-') || 'Gemini'}</strong>
                </div>
              </div>
              {entry.recommendation && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(10,110,253,0.06)', border: '1px solid rgba(13,202,240,0.15)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                  <strong style={{ color: C.cyan }}>Recommendation: </strong>{entry.recommendation}
                </div>
              )}
              <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                <button onClick={() => handleDownload(entry)} disabled={downloading === entry.url}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, rgba(32,201,151,0.15), rgba(10,110,253,0.15))', border: '1px solid rgba(32,201,151,0.3)', color: C.green, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <Download size={13} />
                  Download Full DOCX Report
                </button>
                <button
                  onClick={() => window.open(entry.url, '_blank')}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <Globe size={13} />
                  Visit Site
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(n => <div key={n} className="skeleton" style={{ height: 76, borderRadius: 16 }} />)}
        </div>
      )}

    </Layout>
  );
}
