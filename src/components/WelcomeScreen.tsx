import { Hexagon, ArrowRight, ShieldCheck, Activity, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: Props) {

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at top right, rgba(139,92,246,0.15), transparent 60%), radial-gradient(ellipse at bottom left, rgba(167,139,250,0.1), rgba(10,5,20,0.4) 80%)'
      }}
    >
      
      {/* Floating abstract decorative elements to tie into the 4D background */}
      <div style={{ position: 'absolute', top: '15%', left: '15%', width: 300, height: 300, background: 'rgba(139,92,246,0.15)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: 400, height: 400, background: 'rgba(167,139,250,0.1)', filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none' }} />

      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '50px 80px', borderRadius: 32,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.005) 100%)',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 40px 140px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03) inset',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          textAlign: 'center', maxWidth: 740
        }}
      >
        
        {/* Animated 3D Logo Icon */}
        <div style={{ position: 'relative', marginBottom: 28 }}>
          <div style={{
            position: 'absolute', inset: -15, background: 'rgba(139,92,246,0.4)', filter: 'blur(20px)', borderRadius: '50%',
            animation: 'pulse 3s infinite alternate'
          }} />
          <div style={{
            width: 88, height: 88, borderRadius: 24, background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.05) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(139,92,246,0.5)', boxShadow: '0 8px 32px rgba(139,92,246,0.3)',
            backdropFilter: 'blur(10px)', position: 'relative', zIndex: 2
          }}>
            <Hexagon size={48} color="#8B5CF6" strokeWidth={1.5} style={{ animation: 'spin 20s linear infinite' }} />
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
            background: 'linear-gradient(to right, #8B5CF6, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
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

        {/* CTA Button Wrapper - Full Package Animations with Premium Violet Style */}
        <div style={{ position: 'relative', animation: 'float 5s ease-in-out infinite' }}>
          {/* Intense animated pulse glow behind the button */}
          <div style={{ 
            position: 'absolute', inset: -6, 
            background: 'linear-gradient(135deg, #8B5CF6, #C084FC, #8B5CF6)', 
            filter: 'blur(24px)', opacity: 0.65, 
            borderRadius: 99, animation: 'pulse 2.5s ease-in-out infinite alternate',
            zIndex: -1
          }} />

          <button onClick={onStart} className="glass-violet group transition-all duration-500 hover:scale-[1.03] active:scale-95 focus:outline-none focus:ring-4 focus:ring-violet-500/50" style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '20px 48px',
            borderRadius: 99, color: '#fff',
            fontSize: 16, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer', position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(145deg, rgba(139,92,246,0.6) 0%, rgba(20,10,35,0.8) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.15) inset, 0 8px 32px rgba(139,92,246,0.4)',
            border: 'none', zIndex: 1
          }}>
            {/* Multi-layered shimmer effect */}
            <div style={{ 
              position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', 
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', 
              animation: 'shimmer 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite', transform: 'skewX(-25deg)' 
            }} />
            
            <span style={{ position: 'relative', zIndex: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              Get Started
            </span>
            
            <div style={{
               background: 'rgba(255,255,255,0.1)', padding: 7, borderRadius: '50%',
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               boxShadow: '0 0 15px rgba(255,255,255,0.2) inset',
               border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.9))' }} />
            </div>
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
}
