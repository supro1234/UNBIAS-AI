import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onStart: () => void;
  onSetupApi: () => void;
}

// Fixed-type fadeUp helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp = (delay = 0): any => ({
  initial: { opacity: 0, y: 40, filter: 'blur(10px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { delay, duration: 1.2, ease: [0.16, 1, 0.3, 1] as const },
});

// A pure aesthetic particle component
const AestheticParticles = ({ isNavigating }: { isNavigating: boolean }) => {
  const [particles] = useState(() => {
    const colors = ['#d2bbff', '#4cd6ff', '#3626ce', '#742fe5', '#ffffff'];
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * (window.innerWidth / 1.5) + 100,
      size: Math.random() * 4 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 2 + 0.5,
    }));
  });

  return (
    <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {particles.map((p) => {
        const targetX = Math.cos(p.angle) * p.dist * (isNavigating ? 3 : 1);
        const targetY = Math.sin(p.angle) * p.dist * (isNavigating ? 3 : 1);
        const startX = Math.cos(p.angle) * (p.dist * 0.2);
        const startY = Math.sin(p.angle) * (p.dist * 0.2);

        return (
          <motion.div
            key={p.id}
            initial={{ x: startX, y: startY, opacity: 0, scale: 0 }}
            animate={{
              x: isNavigating ? targetX : [startX, targetX * 0.3, startX],
              y: isNavigating ? targetY : [startY, targetY * 0.3, startY],
              opacity: isNavigating ? [1, 0] : [0.2, 0.8, 0.2],
              scale: isNavigating ? [1, 4] : [0.5, 1, 0.5],
            }}
            transition={{
              duration: isNavigating ? 1.5 : 8 / p.speed,
              repeat: isNavigating ? 0 : Infinity,
              ease: isNavigating ? 'circIn' : 'easeInOut',
            }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: '50%',
              willChange: 'transform, opacity',
            }}
          />
        );
      })}
    </div>
  );
};

export default function WelcomeScreen({ onStart }: Props) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleEnter = () => {
    setIsNavigating(true);
    // Warpspeed cinematic delay before unmounting and triggering actual app start
    setTimeout(() => {
      onStart();
    }, 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(40px)' }}
      transition={{ duration: 1 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        backgroundColor: '#05030a', // Deepest infinite void
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {/* Dynamic Animated Background Gradients */}
      <motion.div 
        animate={{
          background: isNavigating 
            ? 'radial-gradient(circle at 50% 50%, rgba(116,47,229,0.8) 0%, rgba(5,3,10,1) 80%)'
            : 'radial-gradient(circle at 50% 50%, rgba(54,38,206,0.15) 0%, rgba(5,3,10,1) 70%)',
        }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="fixed inset-0 z-0 pointer-events-none"
      />
      
      {/* 3D Warp Particles */}
      <AestheticParticles isNavigating={isNavigating} />

      {/* Main Content - Zooms out smoothly without expensive blurs */}
      <motion.main 
        animate={isNavigating ? { opacity: 0, scale: 1.5 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.7, 0, 0.3, 1] }}
        className="relative z-10 pt-[12vh] pb-40 px-6 max-w-7xl mx-auto flex flex-col items-center text-center origin-center"
        style={{ fontFamily: '"Inter", "Space Grotesk", sans-serif' }}
      >
        {/* Title */}
        <motion.div {...fadeUp(0.4)} className="relative">
          <motion.h1 
            animate={isNavigating ? { textShadow: '0 0 100px #742fe5' } : { textShadow: '0 0 40px rgba(116,47,229,0.4)' }}
            className="text-[5rem] md:text-[9rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-[#ffffff] via-[#d2bbff] to-[#742fe5] mb-2 tracking-tighter leading-none"
          >
            UnbiasNet
          </motion.h1>
        </motion.div>

        {/* Subtitle */}
        <motion.div {...fadeUp(0.6)}>
          <p className="text-xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-[#4cd6ff] to-[#d2bbff] mb-10 tracking-[0.1em] font-medium uppercase drop-shadow-lg">
            AI Fairness Intelligence Platform
          </p>
        </motion.div>

        {/* Description */}
        <motion.div {...fadeUp(0.8)}>
          <p className="max-w-3xl text-[#a39db3] text-lg md:text-xl leading-relaxed mb-16 font-normal drop-shadow-sm">
            Empowering organizations to identify, visualize, and neutralize algorithmic bias. 
            Our neural auditing engine exposes hidden discriminatory patterns across high-stakes 
            decisioning models with mathematical precision.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div {...fadeUp(1.0)} className="mb-28 group relative">
          {/* Hyper-glow backplate */}
          <div className="absolute -inset-2 bg-gradient-to-r from-[#742fe5] via-[#4cd6ff] to-[#3626ce] rounded-full blur-[25px] opacity-60 group-hover:opacity-100 group-hover:blur-[35px] transition-all duration-700 animate-pulse"></div>
          <button 
            onClick={handleEnter}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) translateY(0)' }}
            className="relative px-14 py-6 bg-gradient-to-r from-[#2a1354] to-[#12082b] border border-[#742fe5]/50 text-[#ffffff] font-bold text-xl uppercase tracking-widest rounded-full transition-all duration-300 shadow-[0_0_40px_rgba(116,47,229,0.3)] overflow-hidden flex items-center gap-4"
          >
            {/* Inner shimmer sweep */}
            <motion.div 
              className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-[#d2bbff]/20 to-transparent skew-x-12"
              animate={{ x: ['-200%', '200%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            />
            <span className="relative z-10">{isNavigating ? 'Initiating Core...' : 'Enter Platform'}</span>
            <span className={`relative z-10 transition-transform duration-500 flex ${isNavigating ? 'translate-x-10 opacity-0' : ''}`}>
              →
            </span>
          </button>
        </motion.div>

        {/* Stats Grid (Glassmorphic) */}
        <motion.div {...fadeUp(1.2)} className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl mb-24 relative z-10">
          {[
            { v: '99.2%', l: 'Detection', c: '#d2bbff' },
            { v: '4/5ths', l: 'Fairness Rule', c: '#4cd6ff' },
            { v: '<2s', l: 'Audit Speed', c: '#c3c0ff' },
            { v: '12+', l: 'Bias Dimensions', c: '#742fe5' }
          ].map((stat, i) => (
            <div key={i} className="relative p-8 rounded-[2rem] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] group border border-white/[0.03]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)', backdropFilter: 'blur(30px)' }}>
              {/* Hover sweep on stat cards */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md"></div>
              <span className={`text-4xl md:text-5xl font-black mb-3 tracking-tighter drop-shadow-[0_0_15px_${stat.c}80]`} style={{ color: stat.c, fontFamily: '"Space Grotesk", sans-serif' }}>{stat.v}</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a39db3] drop-shadow-md text-center">{stat.l}</span>
            </div>
          ))}
        </motion.div>

        {/* Feature Tags - Infinity Marquee or Flex Wrap */}
        <motion.div {...fadeUp(1.4)} className="flex flex-wrap justify-center gap-4 relative z-10">
          {['Correlation Mapping', 'Real-time Mitigation', 'Parity Auditing', 'Adversarial Testing', 'Proxy Detection', 'Policy Enforcement'].map((tag) => (
            <span key={tag} className="px-6 py-3 rounded-full bg-[#1c0f33]/40 text-[#c3c0ff]/80 hover:text-white transition-colors duration-300 text-xs font-bold uppercase tracking-[0.15em] border border-[#d2bbff]/10 shadow-lg backdrop-blur-md">
              {tag}
            </span>
          ))}
        </motion.div>
        
      </motion.main>

      {/* Extreme Cinematic Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 opacity-10 mix-blend-overlay" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/black-scales.png")' }}></div>
    </motion.div>
  );
}
