import React from 'react';
import Layout from '../components/Layout';
import { Layers, FileDown, ShieldAlert, Users, TrendingUp, Code, Box, Cloud, Activity } from 'lucide-react';

const features = [
  { id: 1,  title: "Multi-URL Batch Auditing", icon: Layers, desc: "Scan and compare dozens of URLs in a single parallel run." },
  { id: 2,  title: "PDF Export Option", icon: FileDown, desc: "Generate client-ready, branded PDF reports from audit data." },
  { id: 3,  title: "CSV Data Export", icon: Database, desc: "Download raw metrics and scores into CSV formats for deep analysis." },
  { id: 4,  title: "Bias Mitigation Recommendations", icon: ShieldAlert, desc: "Auto-generate robust implementation code to fix flagged biases." },
  { id: 5,  title: "Team Collaboration", icon: Users, desc: "Share dashboards, audit scores, and notes with team members." },
  { id: 6,  title: "Historical Trend Analysis", icon: TrendingUp, desc: "Track platform fairness over months with time-series charts." },
  { id: 7,  title: "Custom Audit Templates", icon: Box, desc: "Define custom heuristics, keywords, and tone thresholds." },
  { id: 8,  title: "API Access", icon: Code, desc: "Integrate the UnbiasNet engine directly into your CI/CD pipelines." },
  { id: 9,  title: "Webhooks", icon: Activity, desc: "Fire real-time alerts to Slack or Discord when critical bias is found." },
  { id: 10, title: "Cloud Deployment", icon: Cloud, desc: "Deploy your own isolated instance of UnbiasNet on AWS or GCP." },
];

interface DatabaseProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

function Database(props: DatabaseProps) {
  // Lucide database icon
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>;
}

export default function UpcomingFeaturesPage() {
  return (
    <Layout title="Upcoming Features" subtitle="A transparent roadmap of what we are building next.">
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: '20px', marginTop: '10px' }}>
        {features.map((f, i) => (
          <div key={f.id} className="card-3d fade-up glow-hover" style={{
            animationDelay: `${i * 0.05}s`,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            border: '1px solid rgba(139,92,246,0.15)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(139,92,246,0.03) 100%)'
          }}>
            {/* Lock overlay styling element */}
            <div style={{
              position: 'absolute', top: '-15px', right: '-15px',
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'rgba(139,92,246,0.1)', filter: 'blur(20px)'
            }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(139,92,246,0.2)'
              }}>
                <f.icon size={18} color="#C084FC" />
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8B5CF6' }}>
                In Development
              </div>
            </div>

            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{f.title}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                {f.desc}
              </div>
            </div>
            
            {/* Padding to keep the card tall without the progress bar */}
            <div style={{ marginTop: 'auto', paddingTop: '10px' }} />
          </div>
        ))}
      </div>

    </Layout>
  );
}
