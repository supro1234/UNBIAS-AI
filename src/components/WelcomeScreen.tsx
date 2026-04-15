import { useEffect, useState } from 'react';
import { Hexagon, ArrowRight, ShieldCheck, Activity, Cpu } from 'lucide-react';

interface Props {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(3,3,5,0.3)',
      opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease'
    }}>
      
      {/* Floating abstract decorative elements to tie into the 4D background */}
      <div style={{ position: 'absolute', top: '15%', left: '15%', width: 300, height: 300, background: 'rgba(66,133,244,0.15)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: 400, height: 400, background: 'rgba(52,168,83,0.1)', filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '50px 80px', borderRadius: 32,
        background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.005) 100%)',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 40px 140px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03) inset',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        textAlign: 'center', maxWidth: 740,
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Animated 3D Logo Icon */}
        <div style={{ position: 'relative', marginBottom: 28 }}>
          <div style={{
            position: 'absolute', inset: -15, background: 'rgba(66,133,244,0.4)', filter: 'blur(20px)', borderRadius: '50%',
            animation: 'pulse 3s infinite alternate'
          }} />
          <div style={{
            width: 88, height: 88, borderRadius: 24, background: 'linear-gradient(135deg, rgba(66,133,244,0.2) 0%, rgba(66,133,244,0.05) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(66,133,244,0.5)', boxShadow: '0 8px 32px rgba(66,133,244,0.3)',
            backdropFilter: 'blur(10px)', position: 'relative', zIndex: 2
          }}>
            <Hexagon size={48} color="#4285F4" strokeWidth={1.5} style={{ animation: 'spin 20s linear infinite' }} />
            <Hexagon size={24} color="#fff" strokeWidth={2} style={{ position: 'absolute', animation: 'spin 15s linear reverse infinite' }} />
          </div>
        </div>

        {/* Hero Typography */}
        <div style={{ position: 'relative' }}>
          <h1 style={{
            fontSize: 64, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 8,
            textShadow: '0 10px 40px rgba(255,255,255,0.1)'
          }}>
            UnbiasNet
          </h1>
          <h2 style={{
            fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: 32,
            background: 'linear-gradient(to right, #4285F4, #34A853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            AI Fairness Intelligence
          </h2>
        </div>

        <p style={{
          fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 40, maxWidth: 520, fontWeight: 400
        }}>
          Uncover hidden discriminatory patterns in your machine learning models before they hit production. An open-source suite for auditing, mitigating, and ensuring ethical AI decisions.
        </p>

        {/* Mini Stat/Feature Bar */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 48 }}>
          {[
            { icon: ShieldCheck, t: '4/5ths Auditing' },
            { icon: Activity, t: 'Correlation Mapping' },
            { icon: Cpu, t: 'Real-time Mitigation' }
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              <f.icon size={16} />
              {f.t}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button onClick={onStart} style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '20px 44px',
          borderRadius: 99, background: 'linear-gradient(135deg, #4285F4 0%, #2b62c2 100%)', color: '#fff',
          fontSize: 16, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
          border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
          boxShadow: '0 16px 40px rgba(66,133,244,0.4), 0 0 0 2px rgba(66,133,244,0.1) inset',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 24px 60px rgba(66,133,244,0.5), 0 0 0 2px rgba(66,133,244,0.2) inset';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 16px 40px rgba(66,133,244,0.4), 0 0 0 2px rgba(66,133,244,0.1) inset';
        }}
        >
          {/* Shine effect overlay */}
          <div style={{ position: 'absolute', top: 0, left: -100, width: 50, height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', animation: 'shimmer 3s infinite', transform: 'skewX(-20deg)' }} />
          Initialize Platform
          <ArrowRight size={20} />
        </button>

      </div>
    </div>
  );
}
