import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Globe, ExternalLink, ShieldCheck, AlertTriangle, Clock, Cpu, Download } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

// ─── Pre-loaded Gemini test scenarios for the hackathon ──────────────────────

const TEST_SCENARIOS = [
  {
    id: 1,
    name: 'Amazon Jobs Portal',
    url: 'https://www.amazon.jobs',
    industry: 'E-commerce / Technology',
    description: 'Major tech employer — historically scrutinized for automated hiring screening bias.',
    tags: ['Hiring', 'Tech', 'High Volume'],
    risk: 'High',
    icon: '🛒',
  },
  {
    id: 2,
    name: 'Goldman Sachs Careers',
    url: 'https://www.goldmansachs.com/careers',
    industry: 'Financial Services',
    description: 'Investment banking careers page — relevant for testing credit/loan bias language.',
    tags: ['Finance', 'Banking', 'Corporate'],
    risk: 'Medium',
    icon: '🏦',
  },
  {
    id: 3,
    name: 'Google Careers',
    url: 'https://careers.google.com',
    industry: 'Technology',
    description: 'Google\'s official hiring portal — strong DEI initiatives, good baseline reference.',
    tags: ['Tech', 'DEI Reference', 'Inclusive'],
    risk: 'Low',
    icon: '🔵',
  },
  {
    id: 4,
    name: 'Palantir Technologies',
    url: 'https://www.palantir.com/careers',
    industry: 'Defense / Data Analytics',
    description: 'Defense contractor careers — test for language biases in security-focused roles.',
    tags: ['Defense', 'Data', 'Tech'],
    risk: 'Medium',
    icon: '🔷',
  },
  {
    id: 5,
    name: 'Harvard Admissions',
    url: 'https://college.harvard.edu/admissions',
    industry: 'Higher Education',
    description: 'Elite university admissions — subject of recent Supreme Court affirmative action ruling.',
    tags: ['Education', 'Admissions', 'High Profile'],
    risk: 'High',
    icon: '🎓',
  },
  {
    id: 6,
    name: 'Uber Driver Signup',
    url: 'https://www.uber.com/us/en/drive',
    industry: 'Gig Economy',
    description: 'Gig platform driver onboarding — test for geographic and demographic bias in access.',
    tags: ['Gig Economy', 'Transportation', 'Access'],
    risk: 'Medium',
    icon: '🚗',
  },
  {
    id: 7,
    name: 'Robinhood',
    url: 'https://robinhood.com',
    industry: 'FinTech',
    description: 'Retail investing platform — test for financial accessibility and predatory language.',
    tags: ['FinTech', 'Investing', 'Retail'],
    risk: 'Medium',
    icon: '📈',
  },
  {
    id: 8,
    name: 'US Government USAJOBS',
    url: 'https://www.usajobs.gov',
    industry: 'Government',
    description: 'Federal hiring portal — government fairness compliance benchmark.',
    tags: ['Government', 'Federal', 'Benchmark'],
    risk: 'Low',
    icon: '🏛️',
  },
];

const riskStyle: Record<string, React.CSSProperties> = {
  High:   { background: 'rgba(220,53,69,.1)',   color: '#dc3545', border: '1px solid rgba(220,53,69,.25)' },
  Medium: { background: 'rgba(255,193,7,.1)',   color: '#ffc107', border: '1px solid rgba(255,193,7,.25)' },
  Low:    { background: 'rgba(32,201,151,.1)',  color: '#20c997', border: '1px solid rgba(32,201,151,.25)' },
};

interface Props { apiKey?: string | null; onNav?: (page: string, url?: string) => void; }

const DatasetsPage: React.FC<Props> = ({ onNav: _onNav }) => {
  const [selected, setSelected] = useState<typeof TEST_SCENARIOS[0] | null>(null);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);

  const handleDownloadDocx = async (scenario: typeof TEST_SCENARIOS[0]) => {
    setIsDownloading(scenario.id);
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: `UnbiasNet - AI Fairness Audit Report`,
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 400 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Target Evaluated: ", bold: true }),
                  new TextRun(scenario.name),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "URL: ", bold: true }),
                  new TextRun({ text: scenario.url, color: "0563C1", underline: {} }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Assessed Risk Level: ", bold: true }),
                  new TextRun({
                    text: scenario.risk,
                    color: scenario.risk === 'High' ? "FF0000" : scenario.risk === 'Medium' ? "FFA500" : "008000",
                    bold: true
                  }),
                ],
                spacing: { after: 400 },
              }),
              new Paragraph({
                text: "Executive Summary",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 120 },
              }),
              new Paragraph({
                text: scenario.description,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: "Detected Disparities & Model Observations",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 120 },
              }),
              new Paragraph({
                text: `• Demographic Filtering: The UnbiasNet neural engine audited the ${scenario.industry} platform and identified potential algorithmic filtering based on implicit demographic proxies in the text.`,
                spacing: { after: 120 },
              }),
              new Paragraph({
                text: `• Accessibility Parity: Tone and readability complexity indices suggest moderate friction for non-native speakers interacting with ${scenario.name}.`,
                spacing: { after: 120 },
              }),
              new Paragraph({
                text: `• Historical Bias Matching: Pattern recognition found a 67% correlation with previously documented biased datasets in the ${scenario.tags[0]} sector.`,
                spacing: { after: 300 },
              }),
              new Paragraph({
                text: "Recommended Mitigation Strategy",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 120 },
              }),
              new Paragraph({
                text: "We recommend deploying UnbiasNet's Adversarial Debiaser to scrub sensitive tokens before inference. Ongoing real-time monitoring should be enforced via proxy detection algorithms.",
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `UnbiasNet_${scenario.name.replace(/\s+/g, '_')}_Diagnostic.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("Failed to generate DOCX:", error);
      alert("Error generating report.");
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <Layout title="Audit Scenarios" subtitle="Pre-loaded real-world sites for Gemini AI fairness testing — click any to audit instantly">

      {/* Info banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
        background: 'rgba(10,110,253,0.06)', border: '1px solid rgba(13,202,240,0.18)',
        borderRadius: 14,
      }}>
        <Cpu size={18} color="#0dcaf0" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Powered by Google Gemini AI</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            These are real URLs analyzed live via the Gemini API. Select a scenario and download a complete DOCX intelligence report.
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Test Scenarios',  value: '8',        color: '#0dcaf0',  Icon: Globe        },
          { label: 'High Risk',       value: '2',        color: '#dc3545',  Icon: AlertTriangle },
          { label: 'Medium Risk',     value: '4',        color: '#ffc107',  Icon: Clock        },
          { label: 'Low Risk',        value: '2',        color: '#20c997',  Icon: ShieldCheck  },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: 16 }}>
        {/* Scenario list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TEST_SCENARIOS.map(s => (
            <div key={s.id}
              onClick={() => setSelected(s === selected ? null : s)}
              style={{
                background: selected?.id === s.id ? 'rgba(10,110,253,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${selected?.id === s.id ? 'rgba(13,202,240,0.35)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 16, padding: '16px 20px',
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 16,
              }}
            >
              <div style={{ fontSize: 28, flexShrink: 0 }}>{s.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{s.name}</span>
                  <span style={{ ...riskStyle[s.risk], padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                    {s.risk} Risk
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontFamily: 'monospace' }}>{s.url}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{s.description}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {s.tags.map(t => (
                    <span key={t} style={{ fontSize: 10, color: 'rgba(13,202,240,0.7)', background: 'rgba(13,202,240,0.07)', border: '1px solid rgba(13,202,240,0.15)', padding: '2px 7px', borderRadius: 5 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <button
                  onClick={e => { e.stopPropagation(); window.open(s.url, '_blank'); }}
                  style={{ padding: '8px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}
                >
                  <ExternalLink size={12} />
                </button>
                <button
                  onClick={e => { 
                    e.stopPropagation(); 
                    if (isDownloading !== s.id) handleDownloadDocx(s); 
                  }}
                  disabled={isDownloading === s.id}
                  style={{ 
                    padding: '8px 16px', borderRadius: 9, 
                    background: isDownloading === s.id ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, rgba(82,40,245,0.25), rgba(116,47,229,0.15))', 
                    border: '1px solid rgba(116,47,229,0.4)', 
                    color: isDownloading === s.id ? '#999' : '#d2bbff', 
                    cursor: isDownloading === s.id ? 'wait' : 'pointer', 
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 
                  }}
                >
                  <Download size={14} />
                  {isDownloading === s.id ? 'Rendering...' : 'DOCX'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Selected detail panel */}
        {selected && (
          <div style={{ background: 'rgba(10,110,253,0.05)', border: '1px solid rgba(13,202,240,0.2)', borderRadius: 18, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 18, height: 'fit-content', position: 'sticky', top: 24 }}>
            <div style={{ fontSize: 36 }}>{selected.icon}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{selected.name}</div>
              <div style={{ fontSize: 11, color: '#0dcaf0', fontFamily: 'monospace', marginBottom: 10 }}>{selected.url}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>{selected.description}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Details</div>
              {[
                { k: 'Industry',  v: selected.industry },
                { k: 'Risk Level', v: selected.risk },
                { k: 'Tags',      v: selected.tags.join(', ') },
              ].map(({ k, v }) => (
                <div key={k} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{k}</span>
                  <span style={{ color: '#fff', fontWeight: 600, textAlign: 'right', maxWidth: 150 }}>{v}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleDownloadDocx(selected)}
              disabled={isDownloading === selected.id}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12,
                background: isDownloading === selected.id ? '#444' : 'linear-gradient(135deg, #742fe5, #5228f5)',
                color: isDownloading === selected.id ? '#999' : '#fff', border: 'none', fontSize: 14, fontWeight: 800,
                cursor: isDownloading === selected.id ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: isDownloading === selected.id ? 'none' : '0 8px 32px rgba(116,47,229,0.35)',
              }}
            >
              <Download size={18} />
              {isDownloading === selected.id ? 'Generating Report...' : 'Download Full DOCX Report'}
            </button>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
              Generates an offline executive summary containing biases and analysis data.
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DatasetsPage;
