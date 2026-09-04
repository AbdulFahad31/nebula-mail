'use client';

import React from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { useEmailDetail } from '@/lib/hooks/useMailQueries';
import { Reply, Forward, Mail, Clock } from 'lucide-react';
import { commandReplyEmail, commandForwardEmail } from '@/lib/commands';

export function EmailDetail() {
  const { emails, selectedEmailId } = useMailStore();
  const { data: queriedEmail } = useEmailDetail(selectedEmailId);

  const selectedEmail =
    queriedEmail ||
    emails.find((e) => e.id === selectedEmailId || e.gmailMessageId === selectedEmailId);

  if (!selectedEmail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAFAF8] dark:bg-[#1E1D1A] border-r border-[#201F1B]/15 dark:border-[#F4F4F0]/15 font-sans transition-colors">
        <Mail className="w-9 h-9 stroke-[1.25] text-[#201F1B]/60 dark:text-[#F4F4F0]/60 mb-2" />
        <h3 className="text-xs font-medium text-[#201F1B] dark:text-[#F4F4F0]">No Document Selected</h3>
        <p className="text-xs text-[#201F1B]/60 dark:text-[#F4F4F0]/60 max-w-xs mt-1 font-sans">
          Select a message from the list or use the assistant to search and open an email.
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
    <div className="flex-1 flex flex-col h-full bg-[#FAFAF8] dark:bg-[#1E1D1A] overflow-y-auto border-r border-[#201F1B]/15 dark:border-[#F4F4F0]/15 font-sans transition-colors">
      {/* Top Action Bar */}
      <div className="p-3 border-b border-[#201F1B]/15 dark:border-[#F4F4F0]/15 bg-[#FAFAF8] dark:bg-[#1E1D1A] flex items-center justify-between">
        <div className="flex items-center gap-2 font-sans">
          <button
            onClick={handleReplyClick}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#24463A] hover:bg-[#1C372E] text-[#FAFAF8] text-xs font-medium transition-colors font-sans"
          >
            <Reply className="w-3.5 h-3.5" />
            Reply
          </button>
          <button
            onClick={handleForwardClick}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FAFAF8] dark:bg-[#1E1D1A] hover:bg-[#201F1B]/5 border border-[#201F1B]/15 dark:border-[#F4F4F0]/15 text-[#201F1B] dark:text-[#F4F4F0] text-xs font-medium transition-colors font-sans"
          >
            <Forward className="w-3.5 h-3.5" />
            Forward
          </button>
        </div>
      </div>

      {/* Main Reading Pane */}
      <div className="p-6 space-y-5 max-w-3xl">
        {/* Subject Header (Source Serif 4 Semibold) */}
        <h1 className="text-xl font-serif-display font-semibold text-[#201F1B] dark:text-[#F4F4F0] tracking-tight leading-snug">
          {selectedEmail.subject}
        </h1>

        {/* Sender Info Card */}
        <div className="flex items-center justify-between gap-4 p-3.5 rounded-md bg-[#FAFAF8] dark:bg-[#1E1D1A] border border-[#201F1B]/15 dark:border-[#F4F4F0]/15">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FAFAF8] dark:bg-[#1E1D1A] border border-[#201F1B]/15 dark:border-[#F4F4F0]/15 flex items-center justify-center font-medium text-[#201F1B] dark:text-[#F4F4F0] text-xs font-sans">
              {(selectedEmail.senderName || selectedEmail.sender).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-serif-display font-semibold text-[#201F1B] dark:text-[#F4F4F0]">
                {selectedEmail.senderName || selectedEmail.sender}
              </div>
              <div className="text-[11px] text-[#201F1B]/60 dark:text-[#F4F4F0]/60 font-sans">
                to <span className="text-[#201F1B] dark:text-[#F4F4F0] font-medium">{selectedEmail.recipient}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-[#201F1B]/60 dark:text-[#F4F4F0]/60 font-sans">
            <Clock className="w-3 h-3 text-[#201F1B]/60 dark:text-[#F4F4F0]/60" />
            {formattedDate}
          </div>
        </div>

        {/* Email Body */}
        <div className="text-xs text-[#201F1B] dark:text-[#F4F4F0] leading-relaxed space-y-3 pt-1 font-sans">
          {selectedEmail.bodyHtml ? (
            <div
              className="prose prose-stone max-w-none text-xs text-[#201F1B] dark:text-[#F4F4F0]"
              dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
            />
          ) : (
            <div className="whitespace-pre-wrap font-sans text-xs text-[#201F1B] dark:text-[#F4F4F0]">{selectedEmail.bodyText}</div>
          )}
        </div>
      </div>
    </div>
  );
}

