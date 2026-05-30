import { motion } from 'framer-motion';
import { Skull, Bug, Play } from 'lucide-react';
import { useMagnetic } from '../hooks/useMagnetic';

export const SimulationPanel = ({ onSimulate, isSimulating }) => {
  const { ref: ddosRef, x: ddosX, y: ddosY } = useMagnetic(0.25);
  const { ref: vulnRef, x: vulnX, y: vulnY } = useMagnetic(0.25);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="fixed left-12 bottom-32 z-20 w-72"
    >
      <div className="glass p-5 rounded-3xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-4 h-4 text-white/40" />
          <span className="text-[9px] font-mono tracking-[0.4em] text-white/30 uppercase">Simulations</span>
        </div>

        <div className="flex flex-col gap-3">
          {/* DDoS Attack */}
          <motion.button
            ref={ddosRef}
            style={{ x: ddosX, y: ddosY }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSimulate('ddos')}
            disabled={isSimulating}
            className="group relative flex items-center gap-4 p-4 glass-hover rounded-xl border border-critical/20 hover:border-critical/50 transition-all overflow-hidden disabled:opacity-50"
          >
            <motion.div
              className="absolute inset-0 bg-critical/5"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.8 }}
            />
            <div className="relative p-2 rounded-lg bg-critical/10">
              <Skull className="w-5 h-5 text-critical" />
            </div>
            <div className="relative flex-1 text-left">
              <span className="block text-sm font-bold text-white uppercase tracking-wide">DDoS Attack</span>
              <span className="block text-[10px] text-white/40 font-mono">Simulate overload</span>
            </div>
            {isSimulating && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-critical border-t-transparent rounded-full"
              />
            )}
          </motion.button>

          {/* Vulnerability Scan */}
          <motion.button
            ref={vulnRef}
            style={{ x: vulnX, y: vulnY }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSimulate('vulnerability')}
            disabled={isSimulating}
            className="group relative flex items-center gap-4 p-4 glass-hover rounded-xl border border-warning/20 hover:border-warning/50 transition-all overflow-hidden disabled:opacity-50"
          >
            <motion.div
              className="absolute inset-0 bg-warning/5"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.8 }}
            />
            <div className="relative p-2 rounded-lg bg-warning/10">
              <Bug className="w-5 h-5 text-warning" />
            </div>
            <div className="relative flex-1 text-left">
              <span className="block text-sm font-bold text-white uppercase tracking-wide">Vuln Scan</span>
              <span className="block text-[10px] text-white/40 font-mono">Detect weaknesses</span>
            </div>
            {isSimulating && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-warning border-t-transparent rounded-full"
              />
            )}
          </motion.button>
        </div>

        {/* Status Indicator */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[9px] font-mono text-white/20 uppercase tracking-wider">Status</span>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-critical' : 'bg-nominal'}`}
            />
            <span className={`text-[10px] font-mono ${isSimulating ? 'text-critical' : 'text-nominal'}`}>
              {isSimulating ? 'RUNNING' : 'READY'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
