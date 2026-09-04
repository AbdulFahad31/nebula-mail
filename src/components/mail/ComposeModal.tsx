'use client';

import React, { useState } from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { X, Send, Paperclip, Sparkles } from 'lucide-react';
import { commandSendEmail } from '@/lib/commands';

export function ComposeModal() {
  const { composeState, setComposeState, closeComposeModal } = useMailStore();

  if (!composeState.isOpen) return null;

  const toValue = composeState.to.join(', ');

  const handleToChange = (val: string) => {
    const addresses = val.split(',').map((s) => s.trim()).filter(Boolean);
    setComposeState({ to: addresses });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    commandSendEmail({ composeDraftId: composeState.draftId });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          New Message
        </div>
        <button
          onClick={closeComposeModal}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form fields */}
      <form onSubmit={handleSubmit} className="p-4 space-y-3 flex-1 flex flex-col">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="text-xs font-medium text-slate-400 w-12">To:</span>
          <input
            type="text"
            placeholder="recipient@example.com"
            value={toValue}
            onChange={(e) => handleToChange(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            required
          />
        </div>

        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="text-xs font-medium text-slate-400 w-12">Subject:</span>
          <input
            type="text"
            placeholder="Subject line"
            value={composeState.subject}
            onChange={(e) => setComposeState({ subject: e.target.value })}
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            required
          />
        </div>

        <textarea
          rows={7}
          placeholder="Write your email body..."
          value={composeState.body}
          onChange={(e) => setComposeState({ body: e.target.value })}
          className="w-full bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none font-sans"
          required
        />

        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            Send Email
          </button>
        </div>
      </form>
    </div>
  );
}
