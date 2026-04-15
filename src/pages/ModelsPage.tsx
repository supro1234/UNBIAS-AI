import Layout from '../components/Layout';
import { Cpu, Zap, Shield, Globe, Clock, Star, ExternalLink, Code2, Brain } from 'lucide-react';

const C = { blue: '#0a6efd', cyan: '#0dcaf0', green: '#20c997', yellow: '#ffc107', violet: '#6f42c1' };

const CAPABILITIES = [
  { Icon: Globe,  color: C.cyan,   title: 'Deep Multi-Page SPA Crawling',  desc: 'Crawls up to 8 pages across 3 depth levels — landing page → sub-pages (Careers, About, Diversity) → job detail pages and DEI sub-pages. Reads footer text and application forms for EEO statements.' },
  { Icon: Brain,  color: C.violet, title: 'Natural Language Bias Detection', desc: 'Analyzes job descriptions, slogans, form fields, and requirement lists for gendered, racially coded, or ageist language patterns.' },
  { Icon: Shield, color: C.green,  title: '4/5ths Rule (Disparate Impact)',  desc: 'Computes acceptance rate ratios across demographic groups. Flags groups below the 80% EEOC disparate impact legal threshold.' },
  { Icon: Zap,    color: C.yellow, title: 'Proxy Variable Detection',        desc: 'Identifies features that correlate with protected characteristics (e.g. ZIP code → race, graduation year → age) via correlation analysis.' },
  { Icon: Code2,  color: C.blue,   title: 'Structured JSON Output',          desc: 'Gemini returns fully typed fairness audit JSON consumed directly by the charts and DOCX report generator — no post-processing needed.' },
  { Icon: Star,   color: C.cyan,   title: 'Model Fallback Chain',            desc: 'Starts with gemini-2.0-flash (free tier) → falls back to gemini-2.5-flash → gemini-2.5-pro to balance cost with quality. Guarantees a result even if primary model is busy.' },
];

const METRICS = [
  { label: 'Disparate Impact',    desc: '4/5ths Rule — EEOC standard',            ref: 'EEOC Uniform Guidelines (1978)' },
  { label: 'Statistical Parity',  desc: 'Equal selection rates across groups',      ref: 'Dwork et al., 2012' },
  { label: 'Equal Opportunity',   desc: 'True positive rate equality',             ref: 'Hardt, Price & Srebro, 2016' },
  { label: 'Proxy Correlation',   desc: 'Indirect discrimination via features',    ref: 'Pedreshi, Ruggieri & Turini, 2008' },
];

export default function ModelsPage() {
  return (
    <Layout title="Gemini AI Engine" subtitle="How the UnbiasNet fairness analysis pipeline works">

      {/* Hero card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(10,110,253,0.08) 0%, rgba(111,66,193,0.06) 100%)',
        border: '1px solid rgba(13,202,240,0.2)', borderRadius: 20, padding: '28px 32px',
        display: 'flex', alignItems: 'center', gap: 28,
      }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(10,110,253,0.12)', border: '1px solid rgba(13,202,240,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 32px rgba(13,202,240,0.1)' }}>
          <Cpu size={36} color={C.cyan} />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Google Gemini AI</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 600 }}>
            UnbiasNet is powered exclusively by Google Gemini via the <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>@google/genai</code> SDK.
            There are no other AI models, no third-party APIs, and no pre-trained classifiers — every insight is produced by Gemini reasoning over live-crawled site content.
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <a href="https://ai.google.dev/" target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: 'rgba(13,202,240,0.1)', border: '1px solid rgba(13,202,240,0.25)', color: C.cyan, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              <ExternalLink size={12} />
              Google AI Docs
            </a>
            <a href="https://github.com/googleapis/js-genai" target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
              <Code2 size={12} />
              SDK Source
            </a>
          </div>
        </div>
      </div>

      {/* Pipeline steps */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18, padding: '22px 28px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Analysis Pipeline — Step by Step
        </div>
        {[
          { step: '01', title: 'URL Submission',      desc: 'User submits any public URL. The API key is kept in-memory and never persisted to disk or sent to any third party.',          time: '< 1s' },
          { step: '02', title: 'Deep Headless Crawling', desc: 'Puppeteer launches headless Chromium, renders the SPA, then crawls 3 levels deep: landing → sub-pages (Careers, About, Diversity, DEI) → individual job postings and application pages. Prioritizes DEI-relevant URLs.', time: '8-15s' },
          { step: '03', title: 'Content Extraction',  desc: 'Up to 8000 chars of body text per page, plus footer text, h1-h3 headings, form labels (including aria-labels), and navigation links are extracted. Footer text is captured separately since DEI/EEO statements often live there.',  time: '< 1s' },
          { step: '04', title: 'Gemini Audit Prompt', desc: 'A structured fairness prompt is sent to Gemini requesting a full JSON audit report: disparate impact, parity, opportunity gap, and proxy detection.', time: '3-6s' },
          { step: '05', title: 'JSON Parsing',        desc: 'Gemini\'s response is extracted with a regex fence-stripper then parsed. If parsing fails, the model fallback chain is triggered automatically.', time: '< 1s' },
          { step: '06', title: 'Report Generation',   desc: 'Results are stored in the server\'s in-memory scan history and returned to the frontend for visualization and DOCX download.',    time: '< 1s' },
        ].map(({ step, title, desc, time }) => (
          <div key={step} style={{ display: 'flex', gap: 20, paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(10,110,253,0.1)', border: '1px solid rgba(13,202,240,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: C.cyan }}>
              {step}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{title}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 5, marginLeft: 'auto' }}>
                  <Clock size={9} style={{ display: 'inline', marginRight: 3 }} />{time}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Capabilities grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {CAPABILITIES.map(({ Icon, color, title, desc }) => (
          <div key={title} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Icon size={18} color={color} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Fairness metrics reference */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18, padding: '22px 28px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 18, textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Academic Fairness Metrics Used
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {METRICS.map(({ label, desc, ref }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{desc}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>{ref}</div>
            </div>
          ))}
        </div>
      </div>

    </Layout>
  );
}
