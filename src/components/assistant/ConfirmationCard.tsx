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

  const isDelete = confirmationCard.type === 'delete';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="p-4 bg-[#1C1F24] border border-[#2A2D33] rounded-lg space-y-3 text-xs font-sans"
    >
      <div className="flex items-center gap-2 text-[#EDECE8] font-serif-display font-semibold text-xs">
        <AlertCircle className="w-4 h-4 text-[#6B9971] shrink-0" />
        <span>Authorization required</span>
      </div>

      <div className="text-xs text-[#EDECE8] font-medium leading-relaxed">
        {confirmationCard.summary}
      </div>

      {/* Payload Preview Card */}
      <div className="p-3 bg-[#14161A] rounded-md border border-[#2A2D33] text-xs space-y-1.5 font-sans">
        {confirmationCard.payload.to && confirmationCard.payload.to.length > 0 && (
          <div>
            <span className="text-[#6B6D73]">{isDelete ? 'Recipient:' : 'To:'}</span>{' '}
            <span className="text-[#EDECE8] font-medium">{confirmationCard.payload.to.join(', ')}</span>
          </div>
        )}
        <div>
          <span className="text-[#6B6D73]">Subject:</span>{' '}
          <span className="text-[#EDECE8] font-serif-display font-semibold">
            {confirmationCard.payload.subject}
          </span>
        </div>
        {confirmationCard.payload.body && (
          <div className="text-[#9A9CA3] line-clamp-2 pt-1.5 border-t border-[#2A2D33] italic font-sans leading-relaxed">
            {confirmationCard.payload.body}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1 font-sans">
        <button
          onClick={handleConfirm}
          disabled={isExecuting}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-[#1C1F24] hover:bg-[#6B9971] text-[#6B9971] hover:text-[#EDECE8] font-medium text-xs border border-[#6B9971]/60 transition-colors disabled:opacity-50 font-sans"
        >
          {isExecuting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          {isDelete ? 'Authorize & Delete' : 'Authorize & send'}
        </button>

        <button
          onClick={confirmationCard.onCancel}
          disabled={isExecuting}
          className="px-3 py-1.5 rounded-md bg-[#14161A] hover:bg-[#1C1F24] text-[#9A9CA3] hover:text-[#EDECE8] font-medium text-xs border border-[#2A2D33] transition-colors font-sans"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
