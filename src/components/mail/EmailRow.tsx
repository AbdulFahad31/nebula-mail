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
      className={`group relative flex items-center gap-3 px-4 py-3.5 border-b border-slate-800/80 cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'bg-cyan-950/40 border-l-4 border-l-cyan-400 text-slate-100'
          : email.isRead
          ? 'bg-slate-950/40 hover:bg-slate-900/60 text-slate-300'
          : 'bg-slate-900/70 hover:bg-slate-900 text-slate-100 font-medium'
      }`}
    >
      {/* Unread indicator dot */}
      <div className="w-2 flex justify-center">
        {!email.isRead && (
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
        )}
      </div>

      {/* Sender Avatar badge */}
      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-xs font-semibold text-cyan-300 shrink-0">
        {(email.senderName || email.sender).charAt(0).toUpperCase()}
      </div>

      {/* Email metadata & snippet */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${!email.isRead ? 'font-semibold text-slate-100' : 'text-slate-300'}`}>
            {email.senderName || email.sender}
          </span>
          <span className="text-xs text-slate-500 shrink-0">{formattedDate}</span>
        </div>
        <div className="text-xs text-slate-200 truncate mt-0.5 font-medium">{email.subject}</div>
        <div className="text-xs text-slate-400 truncate mt-0.5">{email.snippet}</div>
      </div>
    </div>
  );
}
