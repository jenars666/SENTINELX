import { motion } from 'framer-motion';
import { ChevronRight, Zap } from 'lucide-react';

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: seededRandom(i + 1) * 100,
  y: seededRandom(i + 41) * 100,
  endY: seededRandom(i + 81) * 100,
  opacity: seededRandom(i + 121) * 0.5 + 0.2,
  duration: seededRandom(i + 161) * 10 + 10,
}));

export const LandingPage = ({ onEnter }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-0 z-[100] bg-gradient-to-b from-[#020203] via-[#050508] to-[#020203] flex items-center justify-center overflow-hidden"
    >
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0,243,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,243,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          animation: 'gridMove 20s linear infinite'
        }} />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {PARTICLES.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-nominal rounded-full"
            initial={{
              x: `${particle.x}vw`,
              y: `${particle.y}vh`,
              opacity: particle.opacity
            }}
            animate={{
              y: [`${particle.y}vh`, `${particle.endY}vh`],
              opacity: [null, 0]
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ))}
      </div>

      {/* Central Glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-[600px] h-[600px] rounded-full bg-nominal/20 blur-[120px]"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 px-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Zap className="w-16 h-16 text-nominal" strokeWidth={1.5} />
          </motion.div>
          <h1 className="text-7xl font-black tracking-tighter text-white uppercase italic">
            SENTINEL<span className="text-nominal glow-cyan">X</span>
          </h1>
        </motion.div>

        {/* Tagline with Typewriter Effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex flex-col items-center gap-6"
        >
          <p className="text-2xl font-light text-white/60 tracking-wide text-center max-w-2xl">
            THE INTERNET GENERATES <span className="text-nominal font-bold">BILLIONS</span> OF EVENTS EVERY DAY
          </p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="text-3xl font-bold text-white tracking-tight text-center"
          >
            What if you could <span className="text-nominal glow-cyan italic">walk through them?</span>
          </motion.p>
        </motion.div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEnter}
          className="group relative px-12 py-5 glass rounded-2xl border-2 border-nominal/30 hover:border-nominal transition-all duration-500 overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-nominal/10"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />
          <div className="relative flex items-center gap-4">
            <span className="text-xl font-bold text-white tracking-wider uppercase">Enter Terrain</span>
            <ChevronRight className="w-6 h-6 text-nominal group-hover:translate-x-2 transition-transform" />
          </div>
        </motion.button>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.5 }}
          className="flex items-center gap-12 mt-8"
        >
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black text-nominal glow-cyan">14.2K</span>
            <span className="text-xs text-white/40 uppercase tracking-widest font-mono">Active Nodes</span>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black text-nominal glow-cyan">0.02ms</span>
            <span className="text-xs text-white/40 uppercase tracking-widest font-mono">Latency</span>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-4xl font-black text-nominal glow-cyan">99.9%</span>
            <span className="text-xs text-white/40 uppercase tracking-widest font-mono">Uptime</span>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, delay: 3, repeat: Infinity }}
          className="absolute bottom-12 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-white/30 uppercase tracking-[0.3em] font-mono">Scroll to Explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
          >
            <div className="w-1 h-2 bg-nominal rounded-full" />
          </motion.div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(80px); }
        }
      `}</style>
    </motion.div>
  );
};
