import { LayoutDashboard, Database, Cpu, FileWarning, Activity, Hexagon, Sparkles, Settings, KeyRound } from 'lucide-react';

const nav = [
  { id:'dashboard', icon:LayoutDashboard, label:'Overview',  color:'#C084FC' },
  { id:'analyze',   icon:Activity,        label:'Analyze',   color:'#4285F4' },
  { id:'datasets',  icon:Database,        label:'Datasets',  color:'#34A853' },
  { id:'models',    icon:Cpu,             label:'Models',    color:'#FBBC05' },
  { id:'reports',   icon:FileWarning,     label:'Reports',   color:'#EA4335' },
  { id:'features',  icon:Sparkles,        label:'Upcoming',  color:'#0dcaf0' },
];

interface Props {
  active: string;
  onNav: (p: string) => void;
  apiKeyStatus: boolean;
  onApiSetup: () => void;
}

export default function Sidebar({ active, onNav, apiKeyStatus, onApiSetup }: Props) {
  return (
    <aside
      aria-label="Sidebar Navigation"
      style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 'var(--sidebar-w)',
        zIndex: 30, display: 'flex', flexDirection: 'column',
        background: 'rgba(4,4,10,0.82)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Brand ────────────────────────────────── */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* Glow behind logo */}
            <div style={{
              position: 'absolute', inset: -4,
              background: 'rgba(192,132,252,0.3)', filter: 'blur(8px)',
              borderRadius: '50%',
            }} />
            <Hexagon size={26} color="#C084FC" strokeWidth={1.5} style={{ position: 'relative', zIndex: 1 }} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#C084FC', boxShadow: '0 0 10px #C084FC',
              }} />
            </div>
          </div>
          <div className="sidebar-text-content">
            <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: '-0.01em', color: '#fff' }}>UnbiasNet</div>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '.14em',
              textTransform: 'uppercase', color: '#C084FC', marginTop: 1,
            }}>
              AI Platform
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav items ────────────────────────────── */}
      <nav aria-label="Main Navigation" style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(({ id, icon: Icon, label, color }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNav(id)}
              aria-label={`Navigate to ${label}`}
              aria-current={isActive ? 'page' : undefined}
              style={{ position: 'relative' }}
            >
              {/* Active colour accent left-bar */}
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3,
                  borderRadius: '0 3px 3px 0', background: color,
                  boxShadow: `0 0 8px ${color}`,
                }} />
              )}
              <Icon
                size={16}
                strokeWidth={isActive ? 2.2 : 1.8}
                aria-hidden="true"
                style={{ color: isActive ? color : 'inherit', flexShrink: 0 }}
              />
              <span className="sidebar-text-content">{label}</span>
            </button>
          );
        })}

        {/* ── Divider ───────────────────────────── */}
        <div className="divider" style={{ margin: '8px 0' }} />

        {/* ── API Setup button ──────────────────── */}
        <button
          onClick={onApiSetup}
          aria-label="Open API Key Setup"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 10,
            fontSize: 13.5, fontWeight: 600,
            color: apiKeyStatus ? 'rgba(52,168,83,0.85)' : 'rgba(192,132,252,0.85)',
            background: apiKeyStatus ? 'rgba(52,168,83,0.07)' : 'rgba(139,92,246,0.09)',
            border: apiKeyStatus ? '1px solid rgba(52,168,83,0.2)' : '1px solid rgba(139,92,246,0.22)',
            cursor: 'pointer', width: '100%', textAlign: 'left',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = apiKeyStatus ? 'rgba(52,168,83,0.14)' : 'rgba(139,92,246,0.16)';
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = apiKeyStatus ? 'rgba(52,168,83,0.07)' : 'rgba(139,92,246,0.09)';
          }}
        >
          <KeyRound
            size={15}
            strokeWidth={1.9}
            style={{ color: apiKeyStatus ? '#34A853' : '#C084FC', flexShrink: 0 }}
          />
          <span className="sidebar-text-content">
            {apiKeyStatus ? 'API Configured' : 'API Setup'}
          </span>
          {!apiKeyStatus && (
            <div style={{
              marginLeft: 'auto',
              width: 7, height: 7, borderRadius: '50%',
              background: '#EA4335', boxShadow: '0 0 6px #EA4335',
              animation: 'pulse 2s ease-in-out infinite',
              flexShrink: 0,
            }} />
          )}
        </button>
      </nav>

      {/* ── Footer: API Status ────────────────────── */}
      <div style={{ padding: '12px 12px 18px' }}>
        {/* Settings icon row */}
        <button
          onClick={onApiSetup}
          aria-label="API Settings"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '7px 10px', marginBottom: 8,
            background: 'transparent', border: 'none',
            borderRadius: 8, cursor: 'pointer',
            color: 'rgba(255,255,255,0.28)',
            fontSize: 11, fontWeight: 600,
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.color = 'rgba(255,255,255,0.65)';
            b.style.background = 'rgba(255,255,255,0.04)';
          }}
          onMouseLeave={e => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.color = 'rgba(255,255,255,0.28)';
            b.style.background = 'transparent';
          }}
        >
          <Settings size={12} aria-hidden="true" />
          <span className="sidebar-text-content">Settings</span>
        </button>

        {/* Live dot status card */}
        <div
          className="g1"
          style={{
            borderRadius: 12, padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 10,
            border: apiKeyStatus
              ? '1px solid rgba(52,168,83,0.25)'
              : '1px solid rgba(234,67,53,0.2)',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease',
          }}
          onClick={onApiSetup}
          title="Click to manage API key"
        >
          <div
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: apiKeyStatus ? '#34A853' : '#EA4335',
              boxShadow: apiKeyStatus ? '0 0 8px #34A853' : '0 0 6px #EA4335',
              flexShrink: 0,
              animation: apiKeyStatus ? 'pulse 2s ease-in-out infinite' : 'none',
            }}
          />
          <div className="sidebar-text-content" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
              {apiKeyStatus ? 'Gemini Active' : 'API Missing'}
            </div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {apiKeyStatus ? 'Gemini 3 Flash · live' : 'click to configure'}
            </div>
          </div>
          <Settings size={11} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
