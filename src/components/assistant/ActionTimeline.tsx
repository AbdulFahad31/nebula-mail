'use client';

import React from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { CheckCircle2, Loader2, XCircle, List } from 'lucide-react';
import { motion } from 'framer-motion';

export function ActionTimeline() {
  const { actionTimeline } = useMailStore();

  if (actionTimeline.length === 0) return null;

  return (
    <div className="p-3 bg-[#FAFAF8] border border-[#201F1B]/15 rounded-md space-y-2 text-xs font-sans">
      <div className="flex items-center gap-1.5 text-[#201F1B] font-medium text-xs border-b border-[#201F1B]/15 pb-1.5 font-sans">
        <List className="w-3.5 h-3.5 text-[#201F1B]" />
        <span>Action timeline</span>
      </div>

      <div className="space-y-2 pt-0.5 font-sans">
        {actionTimeline.map((step) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 text-[#201F1B]"
          >
            {step.status === 'running' && (
              <Loader2 className="w-3.5 h-3.5 text-[#201F1B] animate-spin shrink-0 mt-0.5" />
            )}
            {step.status === 'completed' && (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#24463A] shrink-0 mt-0.5" />
            )}
            {step.status === 'failed' && (
              <XCircle className="w-3.5 h-3.5 text-[#C2410C] shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0 font-sans">
              <div className="font-medium text-[#201F1B] text-xs font-sans">{step.stepName}</div>
              {step.details && (
                <div className="text-[11px] text-[#201F1B]/60 font-sans truncate">{step.details}</div>
              )}
            </div>

            <span className="text-[10px] text-[#201F1B]/60 font-sans shrink-0">{step.timestamp}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
