'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { EmailAttachment } from '@/lib/gmail/types';
import { X, Send, Paperclip, Mail, GripHorizontal, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { commandSendEmail } from '@/lib/commands';

import { formatFileSize, processSelectedFiles } from '@/lib/utils/attachments';

export function ComposeModal() {
  const { composeState, setComposeState, closeComposeModal } = useMailStore();
  const [toInput, setToInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handlePaperclipClick = () => {
    setErrorMsg(null);
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg(null);
    const existingAttachments = composeState.attachments || [];
    const result = await processSelectedFiles(files, existingAttachments);

    if (result.error) {
      setErrorMsg(result.error);
    }
    if (result.attachments.length > 0) {
      setComposeState({ attachments: result.attachments });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setErrorMsg(null);
    const existing = composeState.attachments || [];
    const updated = existing.filter((a) => a.id !== id);
    setComposeState({ attachments: updated });
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
        {/* Hidden Native File Input */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

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
          {errorMsg && (
            <div className="p-2.5 rounded bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

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
            rows={5}
            placeholder="Write message content..."
            value={composeState.body || ''}
            onChange={(e) => setComposeState({ body: e.target.value })}
            className="w-full bg-[#14161A] p-3 rounded-md border border-[#2A2D33] text-xs text-[#EDECE8] placeholder-[#6B6D73] focus:outline-none focus:border-[#6B9971]/60 resize-none font-sans leading-relaxed flex-1 min-h-[100px]"
            required
          />

          {/* Attachment Chips Section */}
          {composeState.attachments && composeState.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 py-1.5 border-t border-[#2A2D33] max-h-28 overflow-y-auto">
              {composeState.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#14161A] border border-[#2A2D33] text-xs text-[#EDECE8]"
                >
                  <Paperclip className="w-3 h-3 text-[#6B9971]" />
                  <span className="max-w-[140px] truncate font-medium">{att.filename}</span>
                  <span className="text-[10px] text-[#6B6D73]">({formatFileSize(att.size)})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="p-0.5 rounded hover:bg-[#25282E] text-[#6B6D73] hover:text-[#EDECE8] transition-colors ml-0.5"
                    title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePaperclipClick}
              className="p-1.5 text-[#6B6D73] hover:text-[#EDECE8] hover:bg-[#14161A] rounded transition-colors flex items-center gap-1 text-xs"
              title="Attach files"
            >
              <Paperclip className="w-4 h-4 text-[#6B9971]" />
              <span className="text-[11px] text-[#6B6D73] font-sans">Attach</span>
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
