import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import { useMagnetic } from '../hooks/useMagnetic';

const insights = {
  nominal: {
    title: 'System Optimal',
    description: 'All network nodes operating within normal parameters. No anomalies detected.',
    confidence: 98,
    recommendations: [
      'Continue routine monitoring',
      'Maintain current security posture',
      'Schedule next audit in 24h'
    ],
    icon: CheckCircle,
    color: 'text-nominal'
  },
  warning: {
    title: 'Anomaly Detected',
    description: 'Elevated traffic patterns identified. Potential bot activity or DDoS precursor detected.',
    confidence: 89,
    recommendations: [
      'Increase monitoring frequency',
      'Prepare rate limiting protocols',
      'Alert security team standby'
    ],
    icon: AlertCircle,
    color: 'text-warning'
  },
  critical: {
    title: 'Critical Threat Active',
    description: 'Multiple intrusion attempts detected. Coordinated attack pattern identified across 12 nodes.',
    confidence: 96,
    recommendations: [
      'IMMEDIATE: Isolate compromised nodes',
      'Deploy emergency firewall rules',
      'Initiate incident response protocol'
    ],
    icon: AlertCircle,
    color: 'text-critical'
  }
};

const buildUploadedInsight = (stateInsight, analysis) => {
  if (!analysis) return stateInsight;

  const recommendations = analysis.state === 'critical'
    ? [
        'Isolate affected nodes immediately',
        'Apply emergency traffic filtering',
        'Open incident response workflow'
      ]
    : analysis.state === 'warning'
      ? [
          'Review suspicious sources and targets',
          'Increase monitoring on affected assets',
          'Prepare mitigation controls'
        ]
      : [
          'Keep baseline monitoring active',
          'Archive payload for audit trail',
          'Continue scheduled scans'
        ];

  return {
    ...stateInsight,
    title: analysis.state === 'critical'
      ? 'Uploaded Threat Critical'
      : analysis.state === 'warning'
        ? 'Uploaded Anomaly Found'
        : 'Uploaded Payload Clean',
    description: `${analysis.fileName} processed as ${analysis.event}. ${analysis.records} record(s), ${analysis.count || 0} event count, ${analysis.vulnerabilities} vulnerability signal(s), ${analysis.affectedNodes} affected node signal(s).`,
    confidence: analysis.confidence,
    recommendations,
  };
};

export const AIInsightsPanel = ({ state, analysis, isVisible, onToggle }) => {
  const { ref, x, y } = useMagnetic(0.15);
  const insight = buildUploadedInsight(insights[state] || insights.nominal, analysis);
  const Icon = insight.icon;

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        ref={ref}
        style={{ x, y }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        className="fixed right-12 top-32 z-30 p-4 glass rounded-2xl border border-white/10 hover:border-nominal/50 transition-all group"
      >
        <Brain className={`w-6 h-6 ${insight.color} group-hover:scale-110 transition-transform`} />
        {!isVisible && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-nominal rounded-full"
          />
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-12 top-52 z-30 w-96 glass rounded-3xl border border-white/10 p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-xl bg-white/5 ${insight.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white">{insight.title}</h3>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`w-2 h-2 rounded-full ${insight.color.replace('text-', 'bg-')}`}
                  />
                </div>
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.3em]">AI Analysis</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              {insight.description}
            </p>

            {/* Confidence Meter */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Confidence</span>
                <span className={`text-lg font-black ${insight.color}`}>{insight.confidence}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${insight.confidence}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className={`h-full ${insight.color.replace('text-', 'bg-')} rounded-full`}
                />
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-white/40" />
                <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Recommended Actions</span>
              </div>
              <div className="flex flex-col gap-2">
                {insight.recommendations.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                    className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${insight.color.replace('text-', 'bg-')} mt-1.5 flex-shrink-0`} />
                    <span className="text-xs text-white/80 leading-relaxed">{rec}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Live Activity Indicator */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-nominal" />
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Live Analysis</span>
              </div>
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[10px] font-mono text-nominal"
              >
                ACTIVE
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
