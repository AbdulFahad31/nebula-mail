'use client';

import React from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { Reply, Forward, Mail, Clock } from 'lucide-react';
import { commandReplyEmail, commandForwardEmail } from '@/lib/commands';

export function EmailDetail() {
  const { emails, selectedEmailId } = useMailStore();

  const selectedEmail = emails.find(
    (e) => e.id === selectedEmailId || e.gmailMessageId === selectedEmailId
  );

  if (!selectedEmail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-950/30">
        <Mail className="w-12 h-12 stroke-[1.5] text-slate-700 mb-3" />
        <h3 className="text-sm font-semibold text-slate-400">No Email Selected</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Select an email from the inbox list or ask the AI assistant to find and open an email.
        </p>
      </div>
    );
  }

  const formattedDate = new Date(selectedEmail.receivedAt).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleReplyClick = () => {
    commandReplyEmail({ messageId: selectedEmail.id, body: "I'll handle this tomorrow." });
  };

  const handleForwardClick = () => {
    commandForwardEmail({ messageId: selectedEmail.id, to: ['john@example.com'] });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950/40 overflow-y-auto">
      {/* Top Action Bar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleReplyClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold transition-all"
          >
            <Reply className="w-3.5 h-3.5" />
            Reply
          </button>
          <button
            onClick={handleForwardClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-all"
          >
            <Forward className="w-3.5 h-3.5" />
            Forward
          </button>
        </div>
      </div>

      {/* Main Email Content */}
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Subject Header */}
        <h1 className="text-2xl font-serif-display font-medium text-slate-100 tracking-tight leading-snug">
          {selectedEmail.subject}
        </h1>

        {/* Sender & Recipient Info */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-emerald-600 flex items-center justify-center font-bold text-white text-sm">
              {(selectedEmail.senderName || selectedEmail.sender).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">
                {selectedEmail.senderName || selectedEmail.sender}
              </div>
              <div className="text-xs text-slate-400">
                to <span className="text-slate-300">{selectedEmail.recipient}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {formattedDate}
          </div>
        </div>

        {/* Email Body */}
        <div className="text-sm text-slate-200 leading-relaxed space-y-4 pt-2">
          {selectedEmail.bodyHtml ? (
            <div
              className="prose prose-invert max-w-none text-slate-200"
              dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
            />
          ) : (
            <div className="whitespace-pre-wrap font-sans text-slate-200">{selectedEmail.bodyText}</div>
          )}
        </div>
      </div>
    </div>
  );
}
