import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

export const PerformanceMonitor = ({ show = true }) => {
  const [stats, setStats] = useState({
    fps: 60,
    memory: 0,
    drawCalls: 0
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId;

    const updateStats = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // Get memory if available
        const memory = performance.memory 
          ? Math.round(performance.memory.usedJSHeapSize / 1048576) 
          : 0;

        setStats({
          fps: fps,
          memory: memory,
          drawCalls: Math.floor(Math.random() * 50) + 400 // Simulated
        });

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(updateStats);
    };

    if (show) {
      animationId = requestAnimationFrame(updateStats);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [show]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed left-12 top-32 z-30 glass rounded-2xl border border-white/10 p-4 w-48"
    >
      <div className="flex items-center gap-2 mb-3">
        <Cpu className="w-3.5 h-3.5 text-nominal" />
        <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Performance</span>
      </div>

      <div className="flex flex-col gap-2">
        {/* FPS */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/50 font-mono">FPS</span>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${stats.fps >= 55 ? 'bg-nominal' : stats.fps >= 30 ? 'bg-warning' : 'bg-critical'}`} />
            <span className={`text-sm font-bold font-mono ${stats.fps >= 55 ? 'text-nominal' : stats.fps >= 30 ? 'text-warning' : 'text-critical'}`}>
              {stats.fps}
            </span>
          </div>
        </div>

        {/* Memory */}
        {stats.memory > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/50 font-mono">MEM</span>
            <span className="text-sm font-bold font-mono text-white/70">
              {stats.memory}MB
            </span>
          </div>
        )}

        {/* Draw Calls */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/50 font-mono">DRAW</span>
          <span className="text-sm font-bold font-mono text-white/70">
            {stats.drawCalls}
          </span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="mt-3 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-white/20 font-mono uppercase">Status</span>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[9px] text-nominal font-mono"
          >
            OPTIMAL
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
