'use client';

import React from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { CheckCircle2, Loader2, XCircle, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export function ActionTimeline() {
  const { actionTimeline } = useMailStore();

  if (actionTimeline.length === 0) return null;

  return (
    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 text-xs">
      <div className="flex items-center gap-1.5 text-cyan-400 font-semibold uppercase tracking-wider text-[10px]">
        <Terminal className="w-3.5 h-3.5" />
        AI Action Execution Timeline
      </div>

      <div className="space-y-2 pt-1">
        {actionTimeline.map((step) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 text-slate-300"
          >
            {step.status === 'running' && (
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0 mt-0.5" />
            )}
            {step.status === 'completed' && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {step.status === 'failed' && (
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-200">{step.stepName}</div>
              {step.details && (
                <div className="text-[11px] text-slate-400 font-mono truncate">{step.details}</div>
              )}
            </div>

            <span className="text-[10px] text-slate-500 font-mono shrink-0">{step.timestamp}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
