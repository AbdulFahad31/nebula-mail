'use client';

import React from 'react';
import { EmailMessage } from '@/lib/gmail/types';
import { useMailStore } from '@/lib/store/useMailStore';
import { commandOpenEmail } from '@/lib/commands';

interface EmailRowProps {
  email: EmailMessage;
}

// Deterministic avatar styles using single accent palette
function getAvatarStyles(name: string) {
  return {
    bg: 'bg-[#6B9971]/15',
    text: 'text-[#6B9971]',
    border: 'border-[#6B9971]/30',
  };
}

export function EmailRow({ email }: EmailRowProps) {
  const { selectedEmailId } = useMailStore();
  const isSelected = selectedEmailId === email.id || selectedEmailId === email.gmailMessageId;

  const formattedDate = new Date(email.receivedAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  const handleClick = () => {
    commandOpenEmail({ messageId: email.id });
  };

  const displayName = email.senderName || email.sender;
  const avatar = getAvatarStyles(displayName);

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start gap-3 py-3 px-3.5 border-b border-[#2A2D33] cursor-pointer transition-colors duration-150 ${
        isSelected
          ? 'bg-[#1C1F24] border-l-2 border-l-[#6B9971]'
          : 'bg-[#14161A] hover:bg-[#1C1F24]'
      }`}
    >
      {/* Unread marker dot (Single Accent Color Only) */}
      <div className="w-2 pt-2 flex justify-center shrink-0">
        {!email.isRead && (
          <span className="w-2 h-2 rounded-full bg-[#6B9971]" />
        )}
      </div>

      {/* Monogram Avatar */}
      <div
        className={`w-7 h-7 rounded-full border ${avatar.bg} ${avatar.border} ${avatar.text} flex items-center justify-center text-xs font-serif-display font-semibold shrink-0 mt-0.5 transition-transform duration-150 group-hover:scale-[1.03]`}
      >
        {displayName.charAt(0).toUpperCase()}
      </div>

      {/* Email Metadata & Typographic Hierarchy */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`text-[13.5px] font-serif-display tracking-[-0.01em] truncate ${
              !email.isRead ? 'font-semibold text-[#EDECE8]' : 'font-semibold text-[#9A9CA3]'
            }`}
          >
            {displayName}
          </span>
          <span className="text-[11px] font-sans tracking-normal text-[#6B6D73] shrink-0 font-normal">
            {formattedDate}
          </span>
        </div>

        <div className="text-[13px] font-serif-display tracking-[-0.01em] text-[#EDECE8] truncate font-semibold leading-tight">
          {email.subject}
        </div>

        <div className="text-[12px] font-sans tracking-normal text-[#9A9CA3] truncate leading-snug line-clamp-1 font-normal">
          {email.snippet}
        </div>
      </div>
    </div>
  );
}


