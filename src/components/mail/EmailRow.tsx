'use client';

import React from 'react';
import { EmailMessage } from '@/lib/gmail/types';
import { useMailStore } from '@/lib/store/useMailStore';
import { commandOpenEmail, commandDeleteEmail, commandRestoreEmail, commandPermanentlyDeleteEmail } from '@/lib/commands';
import { getRecipientDisplayInfo } from '@/lib/gmail/contacts';
import { Trash2, RotateCcw } from 'lucide-react';

interface EmailRowProps {
  email: EmailMessage;
}

function getAvatarStyles(name: string) {
  return {
    bg: 'bg-[#6B9971]/15',
    text: 'text-[#6B9971]',
    border: 'border-[#6B9971]/30',
  };
}

export function EmailRow({ email }: EmailRowProps) {
  const { selectedEmailId, activeView } = useMailStore();
  const isSelected = selectedEmailId === email.id || selectedEmailId === email.gmailMessageId;

  const isSentView = activeView === 'sent' || email.isSent;

  const formattedDate = new Date(email.receivedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  const handleClick = () => {
    commandOpenEmail({ messageId: email.id });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    commandDeleteEmail({ messageId: email.id });
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    commandRestoreEmail({ messageId: email.id });
  };

  const handlePermanentDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    commandPermanentlyDeleteEmail({ messageId: email.id });
  };

  let displayName: string;
  let avatarName: string;

  if (isSentView) {
    const recipientInfo = getRecipientDisplayInfo(email.recipient);
    displayName = recipientInfo.displayName;
    avatarName = recipientInfo.avatarName;
  } else {
    displayName = email.senderName || email.sender;
    avatarName = displayName;
  }

  const avatar = getAvatarStyles(avatarName);
  const avatarLetter = (avatarName.replace(/^To:s*/i, '').trim().charAt(0) || 'U').toUpperCase();

  return (
    <div
      onClick={handleClick}
      className={`group relative flex items-start gap-3 py-3 px-3.5 border-b border-[#2A2D33] cursor-pointer transition-colors duration-150 ${
        isSelected
          ? 'bg-[#1C1F24] border-l-2 border-l-[#6B9971]'
          : 'bg-[#14161A] hover:bg-[#1C1F24]'
      }`}
    >
      <div className="w-2 pt-2 flex justify-center shrink-0">
        {!email.isRead && (
          <span className="w-2 h-2 rounded-full bg-[#6B9971]" />
        )}
      </div>

      <div
        className={`w-7 h-7 rounded-full border ${avatar.bg} ${avatar.border} ${avatar.text} flex items-center justify-center text-xs font-serif-display font-semibold shrink-0 mt-0.5 transition-transform duration-150 group-hover:scale-[1.03]`}
      >
        {avatarLetter}
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`text-[13.5px] font-serif-display tracking-[-0.01em] truncate ${
              !email.isRead ? 'font-semibold text-[#EDECE8]' : 'font-semibold text-[#9A9CA3]'
            }`}
          >
            {displayName}
          </span>
          
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-sans tracking-normal text-[#6B6D73] font-normal group-hover:hidden">
              {formattedDate}
            </span>

            <div className="hidden group-hover:flex items-center gap-1 font-sans">
              {activeView === 'trash' ? (
                <>
                  <button
                    onClick={handleRestore}
                    className="p-1 rounded text-[#9A9CA3] hover:text-[#EDECE8] hover:bg-[#2A2D33] transition-colors"
                    title="Restore to inbox"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handlePermanentDelete}
                    className="p-1 rounded text-[#9A9CA3] hover:text-[#EDECE8] hover:bg-[#2A2D33] transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleDelete}
                  className="p-1 rounded text-[#9A9CA3] hover:text-[#EDECE8] hover:bg-[#2A2D33] transition-colors"
                  title="Move to Trash"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
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
