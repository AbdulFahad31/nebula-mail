'use client';

import React from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { useEmailDetail } from '@/lib/hooks/useMailQueries';
import { Reply, Forward, Mail, Clock } from 'lucide-react';
import { commandReplyEmail, commandForwardEmail } from '@/lib/commands';

function getAvatarStyles(name: string) {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palettes = [
    { bg: 'bg-[#24463A]/10 dark:bg-[#417562]/20', text: 'text-[#24463A] dark:text-[#6BB397]', border: 'border-[#24463A]/20 dark:border-[#417562]/30' },
    { bg: 'bg-[#201F1B]/8 dark:bg-[#FFFFFF]/10', text: 'text-[#201F1B] dark:text-[#EDEDE9]', border: 'border-[#201F1B]/15 dark:border-[#FFFFFF]/15' },
    { bg: 'bg-[#4A473E]/12 dark:bg-[#C2BCA8]/15', text: 'text-[#3B3830] dark:text-[#D8D2BE]', border: 'border-[#4A473E]/20 dark:border-[#C2BCA8]/25' },
    { bg: 'bg-[#1C372E]/10 dark:bg-[#345E4E]/22', text: 'text-[#1C372E] dark:text-[#78BFA5]', border: 'border-[#1C372E]/20 dark:border-[#345E4E]/30' },
  ];
  return palettes[hash % palettes.length];
}

export function EmailDetail() {
  const { emails, selectedEmailId } = useMailStore();
  const { data: queriedEmail } = useEmailDetail(selectedEmailId);

  const selectedEmail =
    queriedEmail ||
    emails.find((e) => e.id === selectedEmailId || e.gmailMessageId === selectedEmailId);

  if (!selectedEmail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#14161A] border-r border-[#2A2D33] font-sans transition-colors duration-150">
        <div className="w-12 h-12 rounded-full bg-[#1C1F24] border border-[#2A2D33] flex items-center justify-center mb-3">
          <Mail className="w-5 h-5 stroke-[1.5] text-[#6B6D73]" />
        </div>
        <h3 className="text-sm font-serif-display font-semibold text-[#EDECE8] tracking-[-0.01em]">
          No Document Selected
        </h3>
        <p className="text-xs text-[#9A9CA3] max-w-xs mt-1 font-sans leading-relaxed">
          Select a correspondence from the list or use the assistant to search and open an email.
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

  const displayName = selectedEmail.senderName || selectedEmail.sender;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#14161A] overflow-y-auto border-r border-[#2A2D33] font-sans transition-colors duration-150">
      {/* Top Action Bar */}
      <div className="px-4 py-2.5 border-b border-[#2A2D33] bg-[#14161A] flex items-center justify-between">
        <div className="flex items-center gap-2 font-sans">
          <button
            onClick={handleReplyClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#24282F] text-[#6B9971] hover:text-[#EDECE8] border border-[#6B9971]/40 hover:border-[#6B9971]/80 text-xs font-medium font-sans transition-all duration-150"
          >
            <Reply className="w-3.5 h-3.5 text-[#6B9971]" />
            Reply
          </button>
          <button
            onClick={handleForwardClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#24282F] border border-[#2A2D33] text-[#9A9CA3] hover:text-[#EDECE8] text-xs font-medium transition-colors font-sans"
          >
            <Forward className="w-3.5 h-3.5 text-[#6B6D73]" />
            Forward
          </button>
        </div>
      </div>

      {/* Main Reading Pane */}
      <div className="p-6 md:p-8 space-y-6 max-w-3xl">
        {/* Subject Header */}
        <h1 className="text-xl font-serif-display font-semibold text-[#EDECE8] tracking-[-0.01em] leading-snug">
          {selectedEmail.subject}
        </h1>

        {/* Sender Info Card */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-md bg-[#1C1F24] border border-[#2A2D33]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border bg-[#6B9971]/15 border-[#6B9971]/30 text-[#6B9971] flex items-center justify-center font-serif-display font-semibold text-xs shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-[13.5px] font-serif-display font-semibold text-[#EDECE8] tracking-[-0.01em]">
                {displayName}
              </div>
              <div className="text-[11px] text-[#6B6D73] font-sans">
                to <span className="text-[#9A9CA3] font-medium">{selectedEmail.recipient}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#6B6D73] font-sans font-normal">
            <Clock className="w-3 h-3 text-[#6B6D73]" />
            {formattedDate}
          </div>
        </div>

        {/* Email Body Content Container */}
        <div className="space-y-3 pt-2 font-sans">
          {selectedEmail.bodyHtml ? (
            <div className="rounded-xl border border-[#2A2D33] p-5 bg-[#1C1F24]">
              <div className="text-[10px] font-sans font-semibold uppercase tracking-[0.08em] text-[#6B6D73] flex items-center gap-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6B9971]/60" />
                <span>Original formatting preserved</span>
              </div>
              <div className="bg-[#FAFAF8] text-[#14161A] p-6 rounded-lg overflow-x-auto shadow-sm font-sans text-xs">
                <div
                  className="prose prose-stone max-w-none text-xs text-[#14161A] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                />
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap font-sans text-[13.5px] text-[#EDECE8] leading-[1.6] font-normal">
              {selectedEmail.bodyText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


