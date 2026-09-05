'use client';

import React from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { Reply, Forward, Trash2, RotateCcw } from 'lucide-react';
import { commandDeleteEmail, commandRestoreEmail, commandPermanentlyDeleteEmail } from '@/lib/commands';

export function EmailDetail() {
  const { emails, selectedEmailId, activeView, setComposeState } = useMailStore();

  const selectedEmail = emails.find(
    e => e.id === selectedEmailId || e.gmailMessageId === selectedEmailId
  );

  if (!selectedEmail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#14161A] border-r border-[#2A2D33] text-[#6B6D73] font-sans p-6 text-center">
        <div className="w-12 h-12 rounded-full border border-[#2A2D33] bg-[#1C1F24] flex items-center justify-center mb-3">
          <span className="text-lg text-[#6B9971] font-serif-display font-semibold">N</span>
        </div>
        <p className="text-xs font-serif-display font-medium text-[#EDECE8] mb-1">
          No conversation selected
        </p>
        <p className="text-[11px] text-[#6B6D73] font-normal">
          Select an email from your list to read its content
        </p>
      </div>
    );
  }

  const formattedDate = new Date(selectedEmail.receivedAt).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleReplyClick = () => {
    setComposeState({
      isOpen: true,
      to: [selectedEmail.sender],
      subject: selectedEmail.subject.startsWith('Re:')
        ? selectedEmail.subject
        : `Re: ${selectedEmail.subject}`,
      body: `\n\n--- On ${formattedDate}, ${selectedEmail.sender} wrote:\n> ${selectedEmail.snippet}`,
      replyToMessageId: selectedEmail.id,
    });
  };

  const handleForwardClick = () => {
    setComposeState({
      isOpen: true,
      to: [],
      subject: selectedEmail.subject.startsWith('Fwd:')
        ? selectedEmail.subject
        : `Fwd: ${selectedEmail.subject}`,
      body: `\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.sender}\nDate: ${formattedDate}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.snippet}`,
    });
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

          {activeView === 'trash' ? (
            <>
              <button
                onClick={() => commandRestoreEmail({ messageId: selectedEmail.id })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#24282F] border border-[#2A2D33] text-[#9A9CA3] hover:text-[#EDECE8] text-xs font-medium transition-colors font-sans"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#6B9971]" />
                Restore
              </button>
              <button
                onClick={() => commandPermanentlyDeleteEmail({ messageId: selectedEmail.id })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#24282F] border border-[#2A2D33] text-[#9A9CA3] hover:text-[#EDECE8] text-xs font-medium transition-colors font-sans"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#9A9CA3]" />
                Delete Permanently
              </button>
            </>
          ) : (
            <button
              onClick={() => commandDeleteEmail({ messageId: selectedEmail.id })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#24282F] border border-[#2A2D33] text-[#9A9CA3] hover:text-[#EDECE8] text-xs font-medium transition-colors font-sans"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#6B6D73]" />
              Trash
            </button>
          )}
        </div>

        <div className="text-[11px] text-[#6B6D73] font-mono">
          ID: {selectedEmail.id.slice(0, 8)}
        </div>
      </div>

      {/* Main Email Content */}
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4 border-b border-[#2A2D33] pb-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-serif-display font-semibold text-[#EDECE8] tracking-[-0.015em] leading-snug">
              {selectedEmail.subject}
            </h1>
            <span className="text-[11px] font-sans text-[#6B6D73] shrink-0 font-normal pt-1">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-[#6B9971]/30 bg-[#6B9971]/15 text-[#6B9971] flex items-center justify-center font-serif-display font-semibold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-serif-display font-semibold text-[#EDECE8]">
                {displayName}
              </div>
              <div className="text-[11px] font-sans text-[#6B6D73] font-normal">
                {selectedEmail.sender}
              </div>
            </div>
          </div>
        </div>

        {/* Email Body Content Container */}
        <div className="space-y-3 pt-2 font-sans">
          {selectedEmail.bodyHtml ? (
            <div className="rounded-xl border border-[#2A2D33] p-5 bg-[#1C1F24]">
              <div className="text-[10px] font-sans font-semibold text-[#6B6D73] flex items-center gap-1.5 mb-3">
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
