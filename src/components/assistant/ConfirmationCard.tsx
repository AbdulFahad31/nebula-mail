'use client';

import React, { useState } from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-3.5 bg-[#FAFAF8] border border-[#201F1B]/15 rounded-md space-y-2.5 text-xs font-sans shadow-sm"
    >
      <div className="flex items-center gap-1.5 text-[#201F1B] font-medium text-xs">
        <AlertCircle className="w-4 h-4 text-[#24463A] shrink-0" />
        <span>Authorization required</span>
      </div>

      <div className="text-xs text-[#201F1B] font-medium leading-relaxed">
        {confirmationCard.summary}
      </div>

      {/* Payload Preview Card */}
      <div className="p-2.5 bg-[#FAFAF8] rounded-md border border-[#201F1B]/15 text-xs space-y-1 font-sans">
        <div>
          <span className="text-[#201F1B]/60">To:</span>{' '}
          <span className="text-[#201F1B] font-medium">{confirmationCard.payload.to.join(', ')}</span>
        </div>
        <div>
          <span className="text-[#201F1B]/60">Subject:</span>{' '}
          <span className="text-[#201F1B] font-serif-display font-semibold">{confirmationCard.payload.subject}</span>
        </div>
        <div className="text-[#201F1B]/60 line-clamp-2 pt-1 border-t border-[#201F1B]/15 italic font-sans">
          "{confirmationCard.payload.body}"
        </div>
      </div>

      <div className="flex items-center gap-2 pt-0.5 font-sans">
        <button
          onClick={handleConfirm}
          disabled={isExecuting}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-md bg-[#24463A] hover:bg-[#1C372E] text-[#FAFAF8] font-medium text-xs transition-colors disabled:opacity-50 font-sans"
        >
          {isExecuting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Authorize & send
        </button>

        <button
          onClick={confirmationCard.onCancel}
          disabled={isExecuting}
          className="px-3 py-1.5 rounded-md bg-[#FAFAF8] hover:bg-[#201F1B]/5 text-[#201F1B] font-medium text-xs border border-[#201F1B]/15 transition-colors font-sans"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
