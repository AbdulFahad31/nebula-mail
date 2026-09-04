'use client';

import React, { useState } from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { AlertCircle, Send, Check, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function ConfirmationCard() {
  const { confirmationCard } = useMailStore();
  const [isExecuting, setIsExecuting] = useState(false);

  if (!confirmationCard) return null;

  const handleConfirm = async () => {
    setIsExecuting(true);
    try {
      await confirmationCard.onConfirm();
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-cyan-950/60 border border-cyan-500/40 rounded-xl space-y-3 shadow-lg shadow-cyan-950/50"
    >
      <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
        <AlertCircle className="w-4 h-4 text-cyan-400" />
        Human Confirmation Required
      </div>

      <div className="text-xs text-slate-200 font-medium leading-relaxed">
        {confirmationCard.summary}
      </div>

      {/* Payload Preview Card */}
      <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs space-y-1 font-mono">
        <div>
          <span className="text-slate-500">To:</span>{' '}
          <span className="text-slate-300">{confirmationCard.payload.to.join(', ')}</span>
        </div>
        <div>
          <span className="text-slate-500">Subject:</span>{' '}
          <span className="text-slate-300">{confirmationCard.payload.subject}</span>
        </div>
        <div className="text-slate-400 line-clamp-2 pt-1 border-t border-slate-900 font-sans italic">
          "{confirmationCard.payload.body}"
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleConfirm}
          disabled={isExecuting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
        >
          {isExecuting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Confirm & Send
        </button>

        <button
          onClick={confirmationCard.onCancel}
          disabled={isExecuting}
          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-all"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
