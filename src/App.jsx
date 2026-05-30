import { useState, useEffect, useTransition } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  Zap, 
  Activity, 
  Globe, 
  Upload, 
  FileJson, 
  X,
  Radar,
  Terminal,
  Search,
  Clock,
  Crosshair,
  SlidersHorizontal,
  Sparkles,
  Brain
} from 'lucide-react';
import { useMagnetic } from './hooks/useMagnetic';
import { ThreatTopography } from './components/ThreatTopography';
import { LandingPage } from './components/LandingPage';
import { AIInsightsPanel } from './components/AIInsightsPanel';
import { SimulationPanel } from './components/SimulationPanel';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for cleaner class names
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const SEVERITY_TEXT_SCORES = {
  critical: 0.95,
  compromised: 0.92,
  emergency: 0.9,
  failing: 0.88,
  offline: 0.82,
  high: 0.78,
  vulnerable: 0.68,
  elevated: 0.58,
  warning: 0.55,
  medium: 0.5,
  anomaly: 0.48,
  monitoring: 0.32,
  low: 0.24,
  healthy: 0.1,
  nominal: 0.08,
};

const THREAT_KEYWORDS = [
  'attack',
  'intrusion',
  'ddos',
  'botnet',
  'flood',
  'malware',
  'exploit',
  'injection',
  'xss',
  'csrf',
  'lockdown',
  'breach',
];

const VIEW_MODES = [
  { id: 'terrain', label: 'Terrain', icon: Radar },
  { id: 'timeline', label: 'Timeline', icon: Clock },
];

const EVENT_STREAM = [
  { id: 'evt-01', group: 'network', level: 'critical', label: 'Gateway flood spike', meta: '145K req/s', time: '00:04' },
  { id: 'evt-02', group: 'auth', level: 'warning', label: 'Credential entropy drop', meta: '12 hosts', time: '00:11' },
  { id: 'evt-03', group: 'app', level: 'warning', label: 'SQL probe signature', meta: '/api/users', time: '00:18' },
  { id: 'evt-04', group: 'network', level: 'nominal', label: 'Edge route stabilized', meta: '21ms', time: '00:27' },
  { id: 'evt-05', group: 'app', level: 'critical', label: 'Privilege escalation path', meta: 'web_02', time: '00:31' },
  { id: 'evt-06', group: 'auth', level: 'nominal', label: 'MFA challenge passed', meta: '98.1%', time: '00:42' },
];

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const normalizeNumber = (value) => {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  return num > 1 ? clamp01(num / 100) : clamp01(num);
};

const scoreText = (value) => {
  if (typeof value !== 'string') return 0;
  const normalized = value.toLowerCase();

  const severityScore = Object.entries(SEVERITY_TEXT_SCORES).reduce((highest, [keyword, score]) => (
    normalized.includes(keyword) ? Math.max(highest, score) : highest
  ), 0);

  const keywordScore = THREAT_KEYWORDS.some(keyword => normalized.includes(keyword)) ? 0.74 : 0;
  return Math.max(severityScore, keywordScore);
};

const analyzeThreatJson = (payload, fileName) => {
  const signals = {
    explicitSeverity: [],
    count: 0,
    records: 1,
    textScore: 0,
    vulnerabilities: 0,
    affectedNodes: 0,
    source: null,
    target: null,
    event: null,
  };

  const visit = (value, key = '', depth = 0) => {
    const lowerKey = key.toLowerCase();

    if (Array.isArray(value)) {
      signals.records = Math.max(signals.records, value.length);
      if (lowerKey.includes('vulnerab')) signals.vulnerabilities += value.length;
      if (lowerKey.includes('node') || lowerKey.includes('host') || lowerKey.includes('asset')) {
        signals.affectedNodes += value.length;
      }
      value.forEach(item => visit(item, key, depth + 1));
      return;
    }

    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([childKey, childValue]) => visit(childValue, childKey, depth + 1));
      return;
    }

    if (lowerKey.includes('severity') || lowerKey.includes('risk') || lowerKey.includes('score')) {
      const numericScore = normalizeNumber(value);
      if (numericScore !== null) signals.explicitSeverity.push(numericScore);
      signals.textScore = Math.max(signals.textScore, scoreText(value));
    }

    if (lowerKey.includes('count') || lowerKey.includes('total') || lowerKey.includes('requests')) {
      const numericCount = Number(value);
      if (Number.isFinite(numericCount)) signals.count = Math.max(signals.count, numericCount);
    }

    if (lowerKey.includes('vulnerab') || lowerKey.includes('cve')) {
      signals.vulnerabilities += 1;
    }

    if (lowerKey.includes('node') || lowerKey.includes('host') || lowerKey.includes('asset')) {
      signals.affectedNodes += 1;
    }

    if (lowerKey === 'source') signals.source = String(value);
    if (lowerKey === 'target') signals.target = String(value);
    if (lowerKey === 'event' || (lowerKey === 'type' && depth <= 1 && !signals.event)) {
      signals.event = String(value);
    }

    signals.textScore = Math.max(signals.textScore, scoreText(value), scoreText(key));
  };

  visit(payload);

  const explicitSeverity = Math.max(0, ...signals.explicitSeverity);
  const volumeScore = clamp01(signals.count / 1000);
  const vulnerabilityScore = clamp01(signals.vulnerabilities / 8);
  const nodeScore = clamp01(signals.affectedNodes / 12);
  const score = Math.max(
    explicitSeverity,
    signals.textScore,
    volumeScore,
    vulnerabilityScore,
    nodeScore
  );

  const state = score >= 0.8 || signals.count > 500
    ? 'critical'
    : score >= 0.4 || signals.count > 100
      ? 'warning'
      : 'nominal';

  return {
    fileName,
    state,
    score,
    confidence: Math.round(72 + score * 26),
    count: signals.count,
    records: signals.records,
    vulnerabilities: signals.vulnerabilities,
    affectedNodes: signals.affectedNodes,
    source: signals.source,
    target: signals.target,
    event: signals.event || 'JSON_PAYLOAD_ANALYZED',
  };
};

// Custom Tooltip Component
const CursorTooltip = ({ text, position }) => {
  return (
    <motion.div
      key="tooltip"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ 
        left: position.x + 20, 
        top: position.y + 20,
        pointerEvents: 'none',
        position: 'fixed',
        zIndex: 10000,
        background: 'rgba(5, 5, 6, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0, 243, 255, 0.3)',
      }}
      className="px-4 py-2 rounded-lg shadow-[0_0_30px_rgba(0,243,255,0.2)] flex flex-col gap-1 min-w-[180px]"
    >
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-400 font-bold">
          Data Stream
        </span>
      </div>
      <span className="font-sans text-[11px] font-bold text-white/90 leading-tight">
        {text}
      </span>
    </motion.div>
  );
};

// UI Components
const HUDButton = ({ onClick, icon: Icon, label, colorClass, tooltipText, setTooltip, active }) => {
  const { ref, x, y } = useMagnetic(0.2); // Slower pull for better control
  
  return (
    <motion.button
      ref={ref}
      style={{ x, y }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setTooltip(tooltipText)}
      onMouseLeave={() => setTooltip(null)}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-5 px-6 py-4 glass rounded-xl transition-all duration-500",
        "border-l-4 w-full",
        active ? colorClass : "border-white/5 opacity-40 hover:opacity-100"
      )}
    >
      <Icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", active && "animate-pulse")} />
      <span className="font-sans font-bold tracking-widest text-[12px] uppercase">{label}</span>
      {active && (
        <div className={cn("absolute right-4 w-1.5 h-1.5 rounded-full", colorClass.split(' ')[0].replace('border-', 'bg-'))} />
      )}
    </motion.button>
  );
};

const TelemetryItem = ({ label, value, icon: Icon, setTooltip, tooltipText }) => (
  <div 
    onMouseEnter={() => setTooltip(tooltipText)}
    onMouseLeave={() => setTooltip(null)}
    className="flex items-center gap-3 px-4 py-2 border-r border-white/5"
  >
    <Icon className="w-4 h-4 text-white/40" />
    <div className="flex flex-col">
      <span className="text-[9px] uppercase tracking-tighter text-white/30 font-mono">{label}</span>
      <span className="text-xs font-mono font-medium text-white/80">{value}</span>
    </div>
  </div>
);

const ModeSwitcher = ({ activeMode, onChange }) => (
  <motion.div
    initial={{ opacity: 0, y: -12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    className="fixed top-28 left-1/2 -translate-x-1/2 z-30 glass rounded-xl p-1.5 flex items-center gap-1 border-white/10"
  >
    {VIEW_MODES.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        type="button"
        onClick={() => onChange(id)}
        className={cn(
          "relative flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-mono uppercase tracking-[0.18em] transition-all",
          activeMode === id ? "text-black" : "text-white/45 hover:text-white"
        )}
      >
        {activeMode === id && (
          <motion.span
            layoutId="mode-pill"
            className="absolute inset-0 rounded-lg bg-nominal shadow-[0_0_24px_rgba(0,243,255,0.35)]"
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          />
        )}
        <Icon className="relative w-3.5 h-3.5" />
        <span className="relative">{label}</span>
      </button>
    ))}
  </motion.div>
);

const EventStreamPanel = ({ activeFilter, onFilterChange, activeState }) => {
  const filteredEvents = activeFilter === 'all'
    ? EVENT_STREAM
    : EVENT_STREAM.filter(event => event.group === activeFilter || event.level === activeFilter);

  return (
    <motion.section
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7 }}
      className="fixed right-12 top-52 z-20 w-80 glass rounded-2xl border border-white/10 p-5 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-nominal" />
          <span className="text-[9px] font-mono tracking-[0.32em] text-white/35 uppercase">Event Stream</span>
        </div>
        <span className={cn(
          "text-[9px] font-mono uppercase",
          activeState === 'critical' ? 'text-critical' : activeState === 'warning' ? 'text-warning' : 'text-nominal'
        )}>
          {activeState}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1 mb-4">
        {['all', 'network', 'auth', 'app'].map(filter => (
          <button
            key={filter}
            type="button"
            onClick={() => onFilterChange(filter)}
            className={cn(
              "px-2 py-1.5 rounded-md text-[9px] font-mono uppercase transition-all",
              activeFilter === filter ? "bg-white text-black" : "bg-white/5 text-white/35 hover:text-white hover:bg-white/10"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event, index) => (
            <motion.div
              layout
              key={event.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ delay: index * 0.04 }}
              className="group relative overflow-hidden rounded-lg border border-white/5 bg-white/[0.035] px-3 py-2.5"
            >
              <div className={cn(
                "absolute left-0 top-0 h-full w-1",
                event.level === 'critical' ? 'bg-critical' : event.level === 'warning' ? 'bg-warning' : 'bg-nominal'
              )} />
              <div className="flex items-center justify-between gap-3 pl-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white/85">{event.label}</p>
                  <p className="mt-1 text-[9px] font-mono uppercase text-white/30">{event.group} :: {event.meta}</p>
                </div>
                <span className="shrink-0 text-[9px] font-mono text-white/25">{event.time}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

const CommandPalette = ({ isOpen, onClose, onCommand, state }) => {
  const commands = [
    { id: 'nominal', label: 'Set nominal state', icon: Shield, action: () => onCommand('state:nominal') },
    { id: 'warning', label: 'Set warning state', icon: AlertTriangle, action: () => onCommand('state:warning') },
    { id: 'critical', label: 'Set critical state', icon: Zap, action: () => onCommand('state:critical') },
    { id: 'ai', label: 'Toggle AI analysis', icon: Brain, action: () => onCommand('toggle:ai') },
    { id: 'perf', label: 'Toggle performance HUD', icon: SlidersHorizontal, action: () => onCommand('toggle:perf') },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm flex items-start justify-center pt-28"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            className="w-[560px] glass rounded-2xl border border-white/10 p-4 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
              <Search className="h-4 w-4 text-nominal" />
              <span className="flex-1 text-sm text-white/65">Command center</span>
              <span className={cn(
                "text-[10px] font-mono uppercase",
                state === 'critical' ? 'text-critical' : state === 'warning' ? 'text-warning' : 'text-nominal'
              )}>{state}</span>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {commands.map(({ id, label, icon: Icon, action }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    action();
                    onClose();
                  }}
                  className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-left transition-all hover:border-nominal/40 hover:bg-nominal/10"
                >
                  <Icon className="h-4 w-4 text-white/35 group-hover:text-nominal" />
                  <span className="text-sm font-bold text-white/80">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MissionBanner = ({ state, analysis }) => {
  const stateCopy = {
    nominal: 'World stable',
    warning: 'Anomaly rising',
    critical: 'Critical incursion',
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="mission-banner fixed left-1/2 top-40 z-20 w-[min(720px,calc(100vw-32rem))] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/30 px-6 py-4 backdrop-blur-2xl"
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-nominal/70 to-transparent" />
      <div className="flex items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className={cn(
            "grid h-12 w-12 place-items-center rounded-xl border",
            state === 'critical' ? 'border-critical/40 bg-critical/10 text-critical' : state === 'warning' ? 'border-warning/40 bg-warning/10 text-warning' : 'border-nominal/40 bg-nominal/10 text-nominal'
          )}>
            <Crosshair className="h-6 w-6" />
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-white/35">Mission directive</p>
            <h2 className="mt-1 text-2xl font-black uppercase italic tracking-normal text-white">
              {stateCopy[state]} <span className="text-white/35">::</span> {analysis?.event || 'Live terrain sweep'}
            </h2>
          </div>
        </div>
        <div className="hidden flex-col items-end md:flex">
          <span className={cn(
            "text-3xl font-black leading-none",
            state === 'critical' ? 'text-critical glow-red' : state === 'warning' ? 'text-warning glow-amber' : 'text-nominal glow-cyan'
          )}>
            {analysis ? `${Math.round(analysis.score * 100)}%` : state === 'critical' ? '92%' : state === 'warning' ? '45%' : '13%'}
          </span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.28em] text-white/35">exposure</span>
        </div>
      </div>
    </motion.section>
  );
};

const DirectorPanel = ({ state, analysis }) => {
  const bars = state === 'critical'
    ? [92, 84, 100, 73, 88]
    : state === 'warning'
      ? [54, 68, 45, 72, 59]
      : [24, 18, 31, 14, 28];

  return (
    <motion.aside
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28 }}
      transition={{ delay: 0.9 }}
      className="director-panel fixed right-12 top-52 z-20 w-80 rounded-2xl border border-white/10 bg-black/28 p-5 backdrop-blur-2xl"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-nominal" />
          <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-white/35">World Director</span>
        </div>
        <span className={cn(
          "rounded-md px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em]",
          state === 'critical' ? 'bg-critical/10 text-critical' : state === 'warning' ? 'bg-warning/10 text-warning' : 'bg-nominal/10 text-nominal'
        )}>
          {state}
        </span>
      </div>

      <div className="rounded-xl border border-white/5 bg-white/[0.035] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white/80">{analysis?.fileName || 'Procedural threat field'}</span>
          <Activity className="h-4 w-4 text-white/35" />
        </div>
        <p className="mt-2 text-xs leading-5 text-white/42">
          {analysis
            ? `${analysis.records} records mapped across ${analysis.affectedNodes || 'virtual'} nodes.`
            : 'Terrain reacts to threat level, simulations, command palette actions, and uploaded telemetry.'}
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {['Ingress', 'Exploit', 'Density', 'Latency', 'Contain'].map((label, index) => (
          <div key={label}>
            <div className="mb-1.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">
              <span>{label}</span>
              <span>{bars[index]}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bars[index]}%` }}
                transition={{ delay: 1 + index * 0.08, duration: 0.8 }}
                className={cn(
                  "h-full rounded-full",
                  bars[index] > 80 ? 'bg-critical' : bars[index] > 50 ? 'bg-warning' : 'bg-nominal'
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.aside>
  );
};

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [threatState, setThreatState] = useState('nominal');
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [, startTransition] = useTransition();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [tooltip, setTooltip] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });
  const [errorMessage, setErrorMessage] = useState(null);
  const [showNeonFlash, setShowNeonFlash] = useState(false);
  const [fps, setFps] = useState(60);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadAnalysis, setUploadAnalysis] = useState(null);
  const [activeMode, setActiveMode] = useState('terrain');
  const [eventFilter, setEventFilter] = useState('all');
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Stats mock
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(f => Math.max(58, Math.min(61, f + (Math.random() - 0.5))));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cursor tracking
  useEffect(() => {
    const handleMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    
    const handleKeyPress = (e) => {
      // Toggle performance monitor with 'P' key
      if (e.key === 'p' || e.key === 'P') {
        setShowPerformance(prev => !prev);
      }
      // Toggle AI panel with 'I' key
      if (e.key === 'i' || e.key === 'I') {
        setShowAIPanel(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandOpen(false);
      }
    };
    
    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('keydown', handleKeyPress);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Debug log for tooltip state
  useEffect(() => {
    if (tooltip) {
      console.log(`[AETHER.LOG] Tooltip Active: ${tooltip} at x:${cursorPos.x} y:${cursorPos.y}`);
    }
  }, [tooltip, cursorPos]);

  // Entrance Stagger Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] }
    }
  };

  const handleUpdateState = (newState, analysis = null) => {
    setHasInteracted(true); // Mark as interacted
    setUploadAnalysis(analysis);
    startTransition(() => {
      setThreatState(newState);
      if (newState === 'critical') {
        setShowNeonFlash(true);
        setTimeout(() => setShowNeonFlash(false), 600);
      }
      setShakeTrigger(prev => prev + 1);
    });
  };

  const handleCommand = (command) => {
    if (command.startsWith('state:')) {
      handleUpdateState(command.replace('state:', ''));
      return;
    }

    if (command === 'toggle:ai') {
      setShowAIPanel(prev => !prev);
      return;
    }

    if (command === 'toggle:perf') {
      setShowPerformance(prev => !prev);
    }
  };

  const handleSimulation = (type) => {
    setHasInteracted(true); // Mark as interacted
    setIsSimulating(true);
    if (type === 'ddos') {
      handleUpdateState('critical');
      setTimeout(() => {
        setIsSimulating(false);
      }, 3000);
    } else if (type === 'vulnerability') {
      handleUpdateState('warning');
      setTimeout(() => {
        setIsSimulating(false);
      }, 2500);
    }
  };

  const handleFileUpload = (e) => {
    if (e.dataTransfer) {
      e.preventDefault();
      e.stopPropagation();
    }

    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;

    const fileExt = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    if (file.type !== 'application/json' && fileExt !== 'json') {
      triggerError("INVALID FILE TYPE: JSON REQUIRED");
      if (e.target?.value) e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawPayload = String(event.target.result || '').trim();
        if (!rawPayload) {
          triggerError("PARSING ERROR: EMPTY JSON FILE");
          return;
        }

        const data = JSON.parse(rawPayload);
        const analysis = analyzeThreatJson(data, file.name);
        
        setHasInteracted(true); // Mark as interacted
        handleUpdateState(analysis.state, analysis);
      } catch {
        triggerError("PARSING ERROR: CORRUPTED PAYLOAD");
      } finally {
        if (e.target?.value) e.target.value = '';
      }
    };
    reader.onerror = () => {
      triggerError("READ ERROR: FILE COULD NOT BE LOADED");
      if (e.target?.value) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const triggerError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileUpload(e);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showLanding && (
          <LandingPage key="landing" onEnter={() => setShowLanding(false)} />
        )}
      </AnimatePresence>
      
      {!showLanding && (
    <div 
      className={cn(
        "aether-stage relative w-screen h-screen bg-[#020203] overflow-hidden select-none font-sans tracking-tight",
        `aether-${threatState}`
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 1. HOLOGRAPHIC OVERLAYS */}
      <div className="aether-energy-field" />
      <div className="aether-cockpit-frame pointer-events-none">
        <span className="frame-corner frame-corner-tl" />
        <span className="frame-corner frame-corner-tr" />
        <span className="frame-corner frame-corner-bl" />
        <span className="frame-corner frame-corner-br" />
      </div>
      <div className="world-reticle pointer-events-none">
        <span className="reticle-ring reticle-ring-one" />
        <span className="reticle-ring reticle-ring-two" />
        <span className="reticle-axis reticle-axis-x" />
        <span className="reticle-axis reticle-axis-y" />
      </div>
      <div className="hologram-overlay" />
      <div className="noise-overlay" />
      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
        <div className="scanline" />
      </div>

      {/* 3. 3D VIEWPORT */}
      <div className="fixed inset-0 z-0">
        <Canvas shadows gl={{ antialias: true, stencil: true }}>
          <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={40} />
          <Environment preset="city" />
          <color attach="background" args={['#020203']} />
          <fog attach="fog" args={['#020203', 10, 60]} />
          
          <ambientLight intensity={0.4} />
          <spotLight position={[20, 20, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
          <pointLight position={[-10, 15, -10]} intensity={1} color={threatState === 'critical' ? '#ff2a5f' : '#00f3ff'} />

          <Float speed={2} rotationIntensity={0.05} floatIntensity={0.05}>
            <ThreatTopography state={threatState} shakeTrigger={shakeTrigger} hasInteracted={hasInteracted} />
          </Float>

          <OrbitControls 
            enablePan={false} 
            minPolarAngle={Math.PI / 6} 
            maxPolarAngle={Math.PI / 2.5}
            minDistance={10}
            maxDistance={40}
          />
        </Canvas>
      </div>

      {/* 4. HUD ENTRANCE ANIMATION */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative w-full h-full"
      >
        <ModeSwitcher activeMode={activeMode} onChange={setActiveMode} />
        <MissionBanner state={threatState} analysis={uploadAnalysis} />

        {/* Header */}
        <motion.header 
          variants={itemVariants}
          className="fixed top-0 left-0 right-0 h-24 flex items-center justify-between px-16 z-20"
        >
          <div className="flex items-center gap-12">
            <div className="brand-block flex items-center gap-5 rounded-2xl border border-white/10 bg-black/20 px-5 py-3 backdrop-blur-2xl">
              <div className="brand-emblem grid h-12 w-12 place-items-center rounded-xl border border-nominal/30 bg-nominal/10">
                <Shield className="w-7 h-7 text-nominal animate-flicker" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">AETHER<span className="text-nominal">.LOG</span></h1>
                <span className="text-[10px] font-mono tracking-[0.5em] text-white/30 uppercase mt-1">Terrain Sandbox v4.5</span>
              </div>
            </div>
            
            <div className="telemetry-shell flex items-center gap-8 glass px-8 py-3 rounded-full border-white/5">
              <TelemetryItem 
                label="UPLINK" 
                value={`${fps.toFixed(0)}Hz`} 
                icon={Activity} 
                setTooltip={setTooltip}
                tooltipText="STABLE_FREQUENCY"
              />
              <TelemetryItem 
                label="ENCRYPTION" 
                value="AES_256" 
                icon={Globe} 
                setTooltip={setTooltip}
                tooltipText="ENCRYPTED_DATA_PATH"
              />
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className={cn(
              "system-pill flex items-center gap-3 px-6 py-2.5 rounded-full text-[11px] font-mono tracking-[0.2em] border shadow-2xl transition-all duration-1000",
              isOnline ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
            )}>
              <div className={cn("w-2 h-2 rounded-full animate-pulse", isOnline ? "bg-green-400" : "bg-red-400")} />
              {isOnline ? "SYSTEM_ONLINE" : "OFFLINE_PRIORITY"}
            </div>
          </div>
        </motion.header>

        {/* Sidebar - ULTRA COMPACT CONTROL UNIT */}
        <motion.aside 
          variants={itemVariants}
          className="fixed left-12 top-[48%] -translate-y-1/2 w-72 flex flex-col z-20"
        >
          <div className="control-spine glass p-5 rounded-[24px] border-white/10 flex flex-col gap-3 shadow-2xl">
            <div className="flex flex-col mb-1">
              <span className="text-[9px] font-mono tracking-[0.4em] text-white/20 uppercase">Threat Level</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <HUDButton 
                icon={Shield} 
                label="Nominal" 
                active={threatState === 'nominal'}
                colorClass="border-nominal bg-nominal/5" 
                onClick={() => handleUpdateState('nominal')}
                setTooltip={setTooltip}
                tooltipText="STABLE"
              />
              <HUDButton 
                icon={AlertTriangle} 
                label="Warning" 
                active={threatState === 'warning'}
                colorClass="border-warning bg-warning/5" 
                onClick={() => handleUpdateState('warning')}
                setTooltip={setTooltip}
                tooltipText="ANOMALY"
              />
              <HUDButton 
                icon={Zap} 
                label="Critical" 
                active={threatState === 'critical'}
                colorClass="border-critical bg-critical/5" 
                onClick={() => handleUpdateState('critical')}
                setTooltip={setTooltip}
                tooltipText="CRITICAL"
              />
            </div>

          </div>
        </motion.aside>

        {/* Footer - TRUE CENTER READOUT */}
        <motion.footer 
          variants={itemVariants}
          className="fixed bottom-10 left-12 right-12 flex justify-center z-20"
        >
          <div className="metric-dock flex gap-12 glass px-12 py-6 rounded-[28px] border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-3xl min-w-[700px] justify-center items-center">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.4em] mb-2">Exposure_Metric</span>
              <span className={cn(
                 "text-4xl font-black tracking-tighter italic leading-none",
                 threatState === 'critical' ? "text-critical" : threatState === 'warning' ? "text-warning" : "text-nominal"
              )}>
                {uploadAnalysis
                  ? `${Math.round(uploadAnalysis.score * 100)}%`
                  : threatState === 'critical' ? '92.4%' : threatState === 'warning' ? '45.1%' : '12.8%'}
              </span>
            </div>

            <div className="w-px h-8 bg-white/10" />

            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.4em] mb-2">Network_Density</span>
              <span className="text-4xl font-black tracking-tighter text-white/80 italic leading-none">
                {uploadAnalysis?.affectedNodes || '14,292'} <span className="text-[10px] text-white/20 font-normal ml-1">nodes</span>
              </span>
            </div>

            <div className="w-px h-8 bg-white/10" />

            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.4em] mb-2">Sync_Latency</span>
              <span className="text-4xl font-black tracking-tighter text-nominal italic leading-none">0.02<span className="text-[10px] font-normal ml-1">ms</span></span>
            </div>
          </div>
        </motion.footer>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeMode === 'timeline' && (
          <EventStreamPanel
            key="timeline-panel"
            activeFilter={eventFilter}
            onFilterChange={setEventFilter}
            activeState={threatState}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeMode === 'terrain' && !showAIPanel && (
          <DirectorPanel state={threatState} analysis={uploadAnalysis} />
        )}
      </AnimatePresence>

      {/* Tooltip & Toasts */}
      <AnimatePresence>
        {tooltip && (
          <CursorTooltip text={tooltip} position={cursorPos} />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed top-24 right-12 z-30 flex items-center gap-5 p-6 glass border-l-8 border-critical rounded-xl shadow-2xl"
          >
            <AlertTriangle className="w-6 h-6 text-critical" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-critical uppercase font-bold tracking-[0.2em] mb-1">Protocol_Violation</span>
              <span className="text-xs font-bold text-white/90">{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="ml-6 text-white/20 hover:text-white/60 p-1 hover:bg-white/5 rounded">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-18 left-1/2 -translate-x-1/2 z-40 px-10 py-3 bg-red-600 text-white font-mono text-[10px] tracking-[0.3em] font-bold rounded-b-xl shadow-[0_20px_50px_rgba(220,38,38,0.3)]"
          >
            SYSTEM_DISCONNECTED :: OPERATING_LOCAL_MODE
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNeonFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] pointer-events-none bg-critical"
          />
        )}
      </AnimatePresence>

      {/* AI Insights Panel */}
      <AIInsightsPanel 
        state={threatState} 
        analysis={uploadAnalysis}
        isVisible={showAIPanel} 
        onToggle={() => setShowAIPanel(!showAIPanel)} 
      />

      {/* Simulation Panel */}
      <SimulationPanel 
        onSimulate={handleSimulation} 
        isSimulating={isSimulating} 
      />

      {/* Performance Monitor */}
      <PerformanceMonitor show={showPerformance} />

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onCommand={handleCommand}
        state={threatState}
      />

      {/* Command Button */}
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        onClick={() => setIsCommandOpen(true)}
        className="fixed right-12 bottom-40 z-40 group flex w-72 items-center gap-4 p-4 glass rounded-xl border border-white/10 hover:border-nominal/50 hover:bg-white/[0.04] transition-all shadow-[0_0_28px_rgba(255,255,255,0.06)]"
      >
        <div className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
          <Sparkles className="w-5 h-5 text-white/55 group-hover:text-nominal transition-colors" />
        </div>
        <div className="flex flex-col min-w-0 text-left">
          <span className="font-bold text-sm text-white tracking-wide uppercase">Command Center</span>
          <span className="text-[10px] text-white/40 font-mono truncate">CTRL K :: quick actions</span>
        </div>
      </motion.button>

      {/* JSON Upload Button */}
      <motion.label
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="fixed right-12 bottom-20 z-40 group flex items-center gap-4 p-4 glass rounded-xl border-dashed border-2 border-nominal/50 hover:border-nominal hover:bg-nominal/10 transition-all cursor-pointer shadow-[0_0_32px_rgba(0,243,255,0.16)] w-72"
      >
        <input 
          type="file" 
          accept=".json,application/json" 
          onChange={handleFileUpload} 
          className="hidden"
        />
        <div className="w-11 h-11 rounded-lg bg-nominal/10 flex items-center justify-center border border-nominal/20 shrink-0">
          <Upload className="w-5 h-5 text-nominal transition-colors" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm text-white tracking-wide uppercase">Upload JSON File</span>
          <span className="text-[10px] text-white/45 font-mono truncate">
            {uploadAnalysis ? `${uploadAnalysis.fileName} :: ${uploadAnalysis.state.toUpperCase()}` : 'Click here or drag JSON'}
          </span>
        </div>
      </motion.label>

      {/* Keyboard Shortcuts Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="fixed bottom-6 right-12 z-20 text-[9px] font-mono text-white/20 uppercase tracking-wider"
      >
        Press <span className="text-nominal">P</span> for stats • <span className="text-nominal">I</span> for AI
      </motion.div>

      {/* Drag & Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-nominal/10 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          >
            <div className="glass px-16 py-12 rounded-3xl border-4 border-dashed border-nominal">
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <FileJson className="w-20 h-20 text-nominal" />
                </motion.div>
                <p className="text-2xl font-black text-white uppercase tracking-wider">Drop JSON File Here</p>
                <p className="text-sm text-white/50 font-mono">Release to analyze threat data</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
      )}
    </>
  );
}
