import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Crosshair,
  Gamepad2,
  Radio,
  Shield,
  Sparkles,
  Terminal,
  Zap
} from 'lucide-react';

const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const STAR_FIELD = Array.from({ length: 84 }, (_, i) => ({
  id: i,
  x: seededRandom(i + 9) * 100,
  y: seededRandom(i + 91) * 100,
  scale: seededRandom(i + 183) * 1.6 + 0.35,
  opacity: seededRandom(i + 247) * 0.55 + 0.18,
  delay: seededRandom(i + 319) * 4,
}));

const DATA_SHARDS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: 8 + seededRandom(i + 77) * 84,
  top: 12 + seededRandom(i + 141) * 74,
  width: 42 + seededRandom(i + 203) * 84,
  delay: seededRandom(i + 295) * 3,
  duration: 8 + seededRandom(i + 371) * 8,
}));

const STUDIO_METRICS = [
  { value: '14.2K', label: 'Live Nodes' },
  { value: '0.02ms', label: 'World Tick' },
  { value: '99.9%', label: 'Uptime' },
  { value: '360', label: 'Threat View' },
];

const FEATURE_STRIPS = [
  { icon: Crosshair, label: 'Realtime Targeting', value: 'LOCKED' },
  { icon: Radio, label: 'Signal Engine', value: 'ONLINE' },
  { icon: Terminal, label: 'AI Ops Console', value: 'READY' },
];

export const LandingPage = ({ onEnter }) => {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  };

  return (
    <motion.main
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
      transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
      onMouseMove={handlePointerMove}
      className="sentinel-landing fixed inset-0 z-[100] overflow-hidden bg-[#020203] text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(0,243,255,0.16),transparent_32%),linear-gradient(120deg,rgba(255,42,95,0.08),transparent_42%),linear-gradient(240deg,rgba(255,157,0,0.06),transparent_40%)]" />
      <div className="landing-vignette absolute inset-0" />
      <div className="landing-grid absolute inset-x-0 bottom-[-18vh] h-[62vh]" />

      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{ transform: `translate3d(${pointer.x * -18}px, ${pointer.y * -12}px, 0)` }}
      >
        {STAR_FIELD.map((star) => (
          <span
            key={star.id}
            className="landing-star absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.scale}px`,
              height: `${star.scale}px`,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {DATA_SHARDS.map((shard) => (
          <span
            key={shard.id}
            className="data-shard absolute h-px bg-gradient-to-r from-transparent via-nominal/70 to-transparent"
            style={{
              left: `${shard.left}%`,
              top: `${shard.top}%`,
              width: `${shard.width}px`,
              animationDelay: `${shard.delay}s`,
              animationDuration: `${shard.duration}s`,
            }}
          />
        ))}
      </div>

      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.8 }}
        className="absolute left-8 right-8 top-6 z-20 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-nominal/30 bg-nominal/10">
            <Shield className="h-6 w-6 text-nominal" />
          </div>
          <div>
            <p className="text-lg font-black italic tracking-tight">SENTINEL<span className="text-nominal">X</span></p>
            <p className="font-mono text-[9px] uppercase tracking-[0.34em] text-white/35">Aether World Engine</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {['Cinematic UI', 'Live Data', '3D Terrain'].map((item) => (
            <span key={item} className="rounded-lg border border-white/10 bg-white/[0.035] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">
              {item}
            </span>
          ))}
        </div>
      </motion.nav>

      <section className="relative z-10 flex min-h-screen items-center px-6 pb-16 pt-28 sm:px-10 lg:px-16">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_0.92fr]">
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="max-w-5xl"
          >
            <div className="mb-6 inline-flex items-center gap-3 rounded-lg border border-nominal/25 bg-nominal/10 px-4 py-2">
              <Sparkles className="h-4 w-4 text-nominal" />
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-nominal">Next-gen cyber arena</span>
            </div>

            <h1 className="landing-title max-w-6xl text-[clamp(4rem,11vw,10rem)] font-black uppercase italic leading-[0.78] tracking-normal">
              SENTINEL<span>X</span>
            </h1>

            <div className="mt-7 max-w-3xl">
              <p className="text-[clamp(1.35rem,2.8vw,3rem)] font-black uppercase leading-[0.95] tracking-normal text-white">
                Walk through the internet like a playable battlefield.
              </p>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/58 sm:text-lg">
                A cinematic threat sandbox where uploaded JSON becomes terrain, signals become motion, and the dashboard feels like a high-end game command room.
              </p>
            </div>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.035, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onEnter}
                className="landing-cta group relative overflow-hidden rounded-xl border border-nominal/50 bg-nominal px-8 py-5 text-left text-black shadow-[0_0_46px_rgba(0,243,255,0.28)]"
              >
                <span className="absolute inset-0 landing-cta-sheen" />
                <span className="relative flex items-center gap-4">
                  <Gamepad2 className="h-6 w-6" />
                  <span className="flex flex-col">
                    <span className="text-lg font-black uppercase tracking-normal">Enter Terrain</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.26em] opacity-70">Start live world</span>
                  </span>
                  <ChevronRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-2" />
                </span>
              </motion.button>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-5 py-4">
                <Zap className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-bold text-white">Upload-driven visuals</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">JSON to threat world</p>
                </div>
              </div>
            </div>

            <div className="mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {STUDIO_METRICS.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + index * 0.08 }}
                  className="border-l border-white/10 bg-white/[0.025] px-4 py-3"
                >
                  <p className="text-2xl font-black text-nominal glow-cyan">{metric.value}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white/32">{metric.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.45 }}
            className="relative hidden min-h-[620px] lg:block"
            style={{ transform: `translate3d(${pointer.x * 12}px, ${pointer.y * 10}px, 0)` }}
          >
            <div className="arena-stage absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2">
              <div className="arena-ring arena-ring-one" />
              <div className="arena-ring arena-ring-two" />
              <div className="arena-ring arena-ring-three" />
              <div className="arena-core">
                <div className="core-tower core-tower-one" />
                <div className="core-tower core-tower-two" />
                <div className="core-tower core-tower-three" />
                <div className="core-tower core-tower-four" />
                <div className="core-platform" />
              </div>
            </div>

            <div className="absolute right-0 top-12 w-72 rounded-xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">World Systems</span>
                <span className="h-2 w-2 rounded-full bg-nominal shadow-[0_0_18px_rgba(0,243,255,0.8)]" />
              </div>
              <div className="flex flex-col gap-3">
                {FEATURE_STRIPS.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.035] px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-nominal" />
                      <span className="text-xs font-bold text-white/75">{label}</span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-nominal">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute bottom-20 left-4 w-64 rounded-xl border border-critical/20 bg-black/30 p-4 backdrop-blur-xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-critical">Render Pipeline</p>
              <div className="mt-4 flex items-end gap-2">
                {[42, 70, 54, 92, 78, 100, 64, 88].map((height, index) => (
                  <motion.span
                    key={index}
                    animate={{ height: [`${height * 0.55}px`, `${height}px`, `${height * 0.72}px`] }}
                    transition={{ duration: 1.8 + index * 0.12, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-5 rounded-t bg-gradient-to-t from-critical/35 via-warning/70 to-nominal"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="pointer-events-none absolute inset-x-8 bottom-5 z-20 flex items-center justify-between text-[9px] uppercase tracking-[0.26em] text-white/25">
        <span className="font-mono">Cinematic interface system</span>
        <span className="font-mono">Interactive world preview</span>
      </div>
    </motion.main>
  );
};
