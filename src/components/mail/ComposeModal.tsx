'use client';

import React, { useState, useEffect } from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { X, Send, Paperclip, Mail } from 'lucide-react';
import { executeSendEmailDirect } from '@/lib/commands';

export function ComposeModal() {
  const { composeState, setComposeState, closeComposeModal } = useMailStore();
  const [toInput, setToInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setToInput(composeState.to.join(', '));
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
      await executeSendEmailDirect(
        addresses,
        composeState.subject,
        composeState.body,
        composeState.threadId
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-lg bg-[#FAFAF8] border border-[#201F1B]/15 rounded-md shadow-sm overflow-hidden flex flex-col transition-all duration-150 animate-in slide-in-from-bottom-3 font-sans">
      {/* Header */}
      <div className="px-3.5 py-2 bg-[#FAFAF8] border-b border-[#201F1B]/15 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-[#201F1B]">
          <Mail className="w-3.5 h-3.5 text-[#24463A]" />
          New Message
        </div>
        <button
          onClick={closeComposeModal}
          className="p-1 rounded text-[#201F1B]/60 hover:text-[#201F1B] hover:bg-[#201F1B]/5 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="p-3.5 space-y-2.5 flex-1 flex flex-col font-sans">
        <div className="flex items-center gap-2 border-b border-[#201F1B]/15 pb-2">
          <span className="text-xs font-medium text-[#201F1B]/60 w-12 font-sans">To:</span>
          <input
            type="text"
            placeholder="recipient@example.com"
            value={toInput}
            onChange={(e) => handleToChange(e.target.value)}
            className="flex-1 bg-transparent text-xs text-[#201F1B] placeholder-[#201F1B]/60 focus:outline-none font-sans"
            required
          />
        </div>

        <div className="flex items-center gap-2 border-b border-[#201F1B]/15 pb-2">
          <span className="text-xs font-medium text-[#201F1B]/60 w-12 font-sans">Subject:</span>
          <input
            type="text"
            placeholder="Subject line"
            value={composeState.subject}
            onChange={(e) => setComposeState({ subject: e.target.value })}
            className="flex-1 bg-transparent text-xs text-[#201F1B] placeholder-[#201F1B]/60 focus:outline-none font-serif-display font-semibold"
            required
          />
        </div>

        <textarea
          rows={7}
          placeholder="Write message content..."
          value={composeState.body}
          onChange={(e) => setComposeState({ body: e.target.value })}
          className="w-full bg-[#FAFAF8] p-2.5 rounded-md border border-[#201F1B]/15 text-xs text-[#201F1B] placeholder-[#201F1B]/60 focus:outline-none focus:border-[#201F1B]/40 resize-none font-sans"
          required
        />

        <div className="pt-1 flex items-center justify-between">
          <button
            type="button"
            className="p-1.5 text-[#201F1B]/60 hover:text-[#201F1B] hover:bg-[#201F1B]/5 rounded transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>

          <button
            type="submit"
            disabled={isSending}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#24463A] hover:bg-[#1C372E] text-[#FAFAF8] font-medium text-xs transition-colors font-sans disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
