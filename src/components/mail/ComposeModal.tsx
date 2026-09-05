'use client';

import React, { useState, useEffect } from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { X, Send, Paperclip, Mail, GripHorizontal } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { commandSendEmail } from '@/lib/commands';

export function ComposeModal() {
  const { composeState, setComposeState, closeComposeModal } = useMailStore();
  const [toInput, setToInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const dragControls = useDragControls();

  useEffect(() => {
    setToInput(composeState.to ? composeState.to.join(', ') : '');
  }, [composeState.to]);

  if (!composeState.isOpen) return null;

  const handleToChange = (val: string) => {
    setToInput(val);
    const addresses = val.split(',').map((s) => s.trim()).filter(Boolean);
    setComposeState({ to: addresses });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;

    const addresses = toInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (addresses.length === 0) {
      alert('Please enter at least one recipient email address');
      return;
    }

    setIsSending(true);
    try {
      // Trigger Authorization Required Confirmation Card
      await commandSendEmail({
        to: addresses,
        subject: composeState.subject || '',
        body: composeState.body || '',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="fixed bottom-6 right-6 md:right-80 z-50 w-full max-w-md bg-[#1C1F24] border border-[#2A2D33] rounded-lg shadow-2xl overflow-hidden flex flex-col font-sans transition-shadow duration-150"
      >
        {/* Header - Drag Handle Bar */}
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          className="px-4 py-2.5 bg-[#1C1F24] border-b border-[#2A2D33] flex items-center justify-between select-none cursor-grab active:cursor-grabbing hover:bg-[#25282E] transition-colors"
        >
          <div className="flex items-center gap-2 text-xs font-serif-display font-semibold text-[#EDECE8]">
            <GripHorizontal className="w-4 h-4 text-[#6B9971]" />
            <Mail className="w-3.5 h-3.5 text-[#6B9971]" />
            <span>New Message</span>
            <span className="text-[10px] text-[#6B6D73] font-sans font-normal">(Click & Drag Header to Move)</span>
          </div>
          <button
            type="button"
            onClick={closeComposeModal}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 rounded text-[#6B6D73] hover:text-[#EDECE8] hover:bg-[#14161A] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 flex-1 flex flex-col font-sans cursor-auto">
          <div className="flex items-center gap-2 border-b border-[#2A2D33] pb-2">
            <span className="text-xs font-medium text-[#6B6D73] w-12 font-sans">To:</span>
            <input
              type="text"
              placeholder="recipient@example.com"
              value={toInput}
              onChange={(e) => handleToChange(e.target.value)}
              className="flex-1 bg-transparent text-xs text-[#EDECE8] placeholder-[#6B6D73] focus:outline-none font-sans"
              required
            />
          </div>

          <div className="flex items-center gap-2 border-b border-[#2A2D33] pb-2">
            <span className="text-xs font-medium text-[#6B6D73] w-12 font-sans">Subject:</span>
            <input
              type="text"
              placeholder="Subject line"
              value={composeState.subject || ''}
              onChange={(e) => setComposeState({ subject: e.target.value })}
              className="flex-1 bg-transparent text-xs text-[#EDECE8] placeholder-[#6B6D73] focus:outline-none font-serif-display font-semibold"
              required
            />
          </div>

          <textarea
            rows={7}
            placeholder="Write message content..."
            value={composeState.body || ''}
            onChange={(e) => setComposeState({ body: e.target.value })}
            className="w-full bg-[#14161A] p-3 rounded-md border border-[#2A2D33] text-xs text-[#EDECE8] placeholder-[#6B6D73] focus:outline-none focus:border-[#6B9971]/60 resize-none font-sans leading-relaxed"
            required
          />

          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              className="p-1.5 text-[#6B6D73] hover:text-[#EDECE8] hover:bg-[#14161A] rounded transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>

            <button
              type="submit"
              disabled={isSending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#6B9971] text-[#6B9971] hover:text-[#EDECE8] font-medium text-xs border border-[#6B9971]/60 transition-colors font-sans disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSending ? 'Requesting Authorization...' : 'Send'}
            </button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
