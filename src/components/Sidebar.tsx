import { LayoutDashboard, Database, Cpu, FileWarning, Activity, Hexagon } from 'lucide-react';

const nav = [
  { id:'dashboard', icon:LayoutDashboard, label:'Overview' },
  { id:'analyze',   icon:Activity,        label:'Analyze' },
  { id:'datasets',  icon:Database,        label:'Datasets' },
  { id:'models',    icon:Cpu,             label:'Models' },
  { id:'reports',   icon:FileWarning,     label:'Reports' },
];

interface Props { active:string; onNav:(p:string)=>void; apiKeyStatus: boolean; }

export default function Sidebar({ active, onNav, apiKeyStatus }: Props) {
  return (
    <aside style={{
      position:'fixed', left:0, top:0, bottom:0, width:'var(--sidebar-w)',
      zIndex:30, display:'flex', flexDirection:'column',
      background:'rgba(6,6,12,0.75)',
      backdropFilter:'blur(24px)',
      WebkitBackdropFilter:'blur(24px)',
      borderRight:'1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Brand */}
      <div style={{ padding:'22px 18px 18px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ position:'relative', flexShrink:0 }}>
            <Hexagon size={26} color="#4285F4" strokeWidth={1.5}/>
            <div style={{
              position:'absolute', inset:0,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#4285F4', boxShadow:'0 0 8px #4285F4' }}/>
            </div>
          </div>
          <div className="sidebar-text-content">
            <div style={{ fontWeight:800, fontSize:14, letterSpacing:'-.01em', color:'#fff' }}>UnbiasNet</div>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'#4285F4', marginTop:1 }}>AI Fairness Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'10px 10px', display:'flex', flexDirection:'column', gap:2 }}>
        {nav.map(({ id, icon:Icon, label }) => (
          <button key={id} className={`nav-item ${active===id?' active':''}`} onClick={() => onNav(id)}>
            <Icon size={16} strokeWidth={active===id?2.2:1.8}
              style={{ color: active===id?'#4285F4':'inherit', flexShrink:0 }}/>
            <span className="sidebar-text-content">{label}</span>
          </button>
        ))}
      </nav>

      {/* Live dot / API Status */}
      <div style={{ padding:'14px 14px 20px' }}>
        <div className="g1" style={{ borderRadius:12, padding:'10px 12px', display:'flex', alignItems:'center', gap:10, border: apiKeyStatus ? '1px solid rgba(52,168,83,0.3)' : '1px solid rgba(255,255,255,0.05)' }}>
          <div className={apiKeyStatus ? "pulse" : ""} style={{ width:7, height:7, borderRadius:'50%', background: apiKeyStatus ? '#34A853' : '#EA4335', boxShadow: apiKeyStatus ? '0 0 6px #34A853' : 'none', flexShrink:0 }}/>
          <div className="sidebar-text-content" style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#fff' }}>{apiKeyStatus ? 'Gemini Active' : 'API Missing'}</div>
            <div className="mono" style={{ fontSize:9, color:'var(--text-3)', whiteSpace:'nowrap', overflow:'hidden' }}>{apiKeyStatus ? '2.0-Flash-Live' : 'offline'}</div>
          </div>
          <Activity size={12} style={{ color: apiKeyStatus ? '#34A853' : 'var(--text-3)', flexShrink:0 }}/>
        </div>
      </div>
    </aside>
  );
}
