'use client';

import React from 'react';
import { EmailMessage } from '@/lib/gmail/types';
import { useMailStore } from '@/lib/store/useMailStore';
import { commandOpenEmail } from '@/lib/commands';

interface EmailRowProps {
  email: EmailMessage;
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

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start gap-2.5 px-3 py-2.5 border-b border-[#201F1B]/15 cursor-pointer transition-colors duration-100 ${
        isSelected
          ? 'bg-[#FAFAF8] border-l-2 border-l-[#24463A]'
          : email.isRead
          ? 'bg-[#FAFAF8] hover:bg-[#201F1B]/5 text-[#201F1B]/60'
          : 'bg-[#FAFAF8] hover:bg-[#201F1B]/5 text-[#201F1B]'
      }`}
    >
      {/* Unread marker dot (Bottle Green accent) */}
      <div className="w-1.5 pt-1.5 flex justify-center shrink-0">
        {!email.isRead && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#24463A]" />
        )}
      </div>

      {/* Sender Avatar */}
      <div className="w-6 h-6 rounded-full bg-[#FAFAF8] border border-[#201F1B]/15 flex items-center justify-center text-[11px] font-medium text-[#201F1B] shrink-0 mt-0.5 font-sans">
        {(email.senderName || email.sender).charAt(0).toUpperCase()}
      </div>

      {/* Email Metadata & Snippet */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`text-xs font-serif-display font-semibold truncate ${!email.isRead ? 'text-[#201F1B]' : 'text-[#201F1B]/60'}`}>
            {email.senderName || email.sender}
          </span>
          <span className="text-[11px] text-[#201F1B]/60 font-sans shrink-0">{formattedDate}</span>
        </div>
        <div className="text-xs font-serif-display font-semibold text-[#201F1B] truncate mt-0.5">{email.subject}</div>
        <div className="text-xs text-[#201F1B]/60 truncate mt-0.5 font-sans">{email.snippet}</div>
      </div>
    </div>
  );
}
