'use client';

import React, { useState, useRef } from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { AlertCircle, Check, Loader2, Paperclip, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatFileSize, processSelectedFiles } from '@/lib/utils/attachments';

export function ConfirmationCard() {
  const { confirmationCard, setConfirmationCard } = useMailStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!confirmationCard) return null;

  const handleConfirm = async () => {
    setIsExecuting(true);
    try {
      await confirmationCard.onConfirm();
    } finally {
      setIsExecuting(false);
    }
  };

  const isDelete = confirmationCard.type === 'delete';
  const attachments = confirmationCard.payload.attachments || [];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !confirmationCard) return;

    setErrorMsg(null);
    const result = await processSelectedFiles(files, attachments);

    if (result.error) {
      setErrorMsg(result.error);
    }

    if (result.attachments.length > 0) {
      setConfirmationCard({
        ...confirmationCard,
        payload: {
          ...confirmationCard.payload,
          attachments: result.attachments,
        },
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    if (!confirmationCard) return;
    setErrorMsg(null);
    const updated = attachments.filter((a) => a.id !== id);
    setConfirmationCard({
      ...confirmationCard,
      payload: {
        ...confirmationCard.payload,
        attachments: updated,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="p-4 bg-[#1C1F24] border border-[#2A2D33] rounded-lg space-y-3 text-xs font-sans"
    >
      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center gap-2 text-[#EDECE8] font-serif-display font-semibold text-xs">
        <AlertCircle className="w-4 h-4 text-[#6B9971] shrink-0" />
        <span>Authorization required</span>
      </div>

      <div className="text-xs text-[#EDECE8] font-medium leading-relaxed">
        {confirmationCard.summary}
      </div>

      {errorMsg && (
        <div className="p-2 rounded bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Payload Preview Card */}
      <div className="p-3 bg-[#14161A] rounded-md border border-[#2A2D33] text-xs space-y-1.5 font-sans">
        {confirmationCard.payload.to && confirmationCard.payload.to.length > 0 && (
          <div>
            <span className="text-[#6B6D73]">{isDelete ? 'Recipient:' : 'To:'}</span>{' '}
            <span className="text-[#EDECE8] font-medium">{confirmationCard.payload.to.join(', ')}</span>
          </div>
        )}
        <div>
          <span className="text-[#6B6D73]">Subject:</span>{' '}
          <span className="text-[#EDECE8] font-serif-display font-semibold">
            {confirmationCard.payload.subject}
          </span>
        </div>
        {confirmationCard.payload.body && (
          <div className="text-[#9A9CA3] line-clamp-2 pt-1.5 border-t border-[#2A2D33] italic font-sans leading-relaxed">
            {confirmationCard.payload.body}
          </div>
        )}

        {/* Removable Attachment Chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#2A2D33] max-h-28 overflow-y-auto">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1C1F24] border border-[#2A2D33] text-xs text-[#EDECE8]"
              >
                <Paperclip className="w-3 h-3 text-[#6B9971]" />
                <span className="max-w-[130px] truncate font-medium">{att.filename}</span>
                <span className="text-[10px] text-[#6B6D73]">({formatFileSize(att.size)})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-0.5 rounded hover:bg-[#25282E] text-[#6B6D73] hover:text-[#EDECE8] transition-colors ml-0.5"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attach File Action Button */}
      {!isDelete && (
        <div className="flex items-center justify-between pt-0.5 font-sans">
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-1.5 py-1 px-2 rounded hover:bg-[#14161A] text-[#6B9971] hover:text-[#EDECE8] text-xs font-medium border border-transparent hover:border-[#2A2D33] transition-colors"
          >
            <Paperclip className="w-3.5 h-3.5 text-[#6B9971]" />
            <span>{attachments.length > 0 ? 'Attach more files' : 'Attach file'}</span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 font-sans">
        <button
          onClick={handleConfirm}
          disabled={isExecuting}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-[#1C1F24] hover:bg-[#6B9971] text-[#6B9971] hover:text-[#EDECE8] font-medium text-xs border border-[#6B9971]/60 transition-colors disabled:opacity-50 font-sans"
        >
          {isExecuting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          {isDelete ? 'Authorize & Delete' : 'Authorize & send'}
        </button>

        <button
          onClick={confirmationCard.onCancel}
          disabled={isExecuting}
          className="px-3 py-1.5 rounded-md bg-[#14161A] hover:bg-[#1C1F24] text-[#9A9CA3] hover:text-[#EDECE8] font-medium text-xs border border-[#2A2D33] transition-colors font-sans"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
