'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EmailMessage } from '@/lib/gmail/types';
import { EmailBrief } from '@/lib/ai/email-brief';
import { useMailStore } from '@/lib/store/useMailStore';
import { Sparkles, Clock, CheckCircle2, ListChecks, MessageSquareReply, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NebulaBriefProps {
  email: EmailMessage;
}

export function NebulaBrief({ email }: NebulaBriefProps) {
  const queryClient = useQueryClient();
  const [requestedMap, setRequestedMap] = useState<Record<string, boolean>>({});
  const { setComposeState } = useMailStore();

  const contentHash = `${email.id}_${email.receivedAt}`;
  const queryKey = ['emailBrief', email.id, contentHash];

  // Check if brief was already generated & cached for THIS email in a prior click
  const cachedData = queryClient.getQueryData<{ brief: EmailBrief }>(queryKey);
  const isUserRequested = Boolean(requestedMap[email.id]);

  // Enable query ONLY if user explicitly clicked "Generate Brief" for THIS email OR if cached data already exists
  const isEnabled = isUserRequested || Boolean(cachedData);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<{ brief: EmailBrief }>({
    queryKey,
    queryFn: async () => {
      const res = await fetch('/api/assistant/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: email.id }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate brief');
      }

      return await res.json();
    },
    enabled: isEnabled,
    staleTime: Infinity,
    retry: 1,
  });

  const handleGenerateClick = () => {
    setRequestedMap((prev) => ({ ...prev, [email.id]: true }));
    if (isEnabled) {
      refetch();
    }
  };

  const handleDraftReplyClick = (suggestedReplyText: string) => {
    const formattedDate = new Date(email.receivedAt).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const replySubject = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;

    setComposeState({
      isOpen: true,
      to: [email.sender],
      subject: replySubject,
      body: `${suggestedReplyText}\n\n--- On ${formattedDate}, ${email.sender} wrote:\n> ${email.snippet}`,
      replyToMessageId: email.id,
    });
  };

  // 1. Collapsed default state: small "✨ Generate Brief" button
  if (!isEnabled && !data) {
    return (
      <div className="py-1">
        <button
          type="button"
          onClick={handleGenerateClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1F24] hover:bg-[#24282F] text-[#6B9971] hover:text-[#EDECE8] border border-[#6B9971]/40 hover:border-[#6B9971] text-xs font-medium font-sans transition-all duration-150 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#6B9971]" />
          <span>Generate Brief</span>
        </button>
      </div>
    );
  }

  // 2. Loading state: skeleton / shimmer card
  if (isLoading || (isFetching && !data)) {
    return (
      <div className="p-4 bg-[#1C1F24] border border-[#2A2D33] rounded-xl space-y-3 font-sans animate-pulse">
        <div className="flex items-center justify-between border-b border-[#2A2D33] pb-2.5">
          <div className="flex items-center gap-2 text-xs font-serif-display font-semibold text-[#EDECE8]">
            <Sparkles className="w-4 h-4 text-[#6B9971] animate-spin" />
            <span>Analyzing email...</span>
          </div>
          <Loader2 className="w-3.5 h-3.5 text-[#6B6D73] animate-spin" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-[#2A2D33] rounded w-3/4" />
          <div className="h-3 bg-[#2A2D33] rounded w-1/2" />
        </div>
      </div>
    );
  }

  // 3. Error state
  if (isError || !data?.brief) {
    const errorMsg = error instanceof Error ? error.message : 'Unable to generate the brief.';
    return (
      <div className="p-4 bg-[#1C1F24] border border-red-900/40 rounded-xl space-y-3 font-sans text-xs">
        <div className="flex items-center gap-2 text-red-400 font-medium">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>Unable to generate the brief.</span>
        </div>
        <p className="text-[#9A9CA3] text-[11px] leading-relaxed">{errorMsg}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#14161A] hover:bg-[#25282E] text-[#EDECE8] border border-[#2A2D33] text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3 h-3 text-[#6B9971]" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const { brief } = data;
  const hasActionItems = brief.actionItems && brief.actionItems.length > 0;
  const hasKeyPoints = brief.keyPoints && brief.keyPoints.length > 0;

  // 4. Expanded Brief Card
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-[#1C1F24] border border-[#2A2D33] rounded-xl space-y-4 font-sans text-xs text-[#EDECE8]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2D33] pb-2.5">
          <div className="flex items-center gap-2 text-xs font-serif-display font-semibold text-[#EDECE8]">
            <Sparkles className="w-4 h-4 text-[#6B9971] shrink-0" />
            <span>Nebula Brief</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1 rounded text-[#6B6D73] hover:text-[#EDECE8] hover:bg-[#14161A] transition-colors"
            title="Regenerate Brief"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#6B9971]' : ''}`} />
          </button>
        </div>

        {/* Summary Section */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider font-semibold font-sans text-[#6B6D73]">
            Summary
          </div>
          <p className="text-xs text-[#EDECE8] leading-relaxed font-sans">{brief.summary}</p>
        </div>

        {/* Action Items Section */}
        {hasActionItems && (
          <div className="space-y-1.5 pt-2 border-t border-[#2A2D33]">
            <div className="text-[10px] uppercase tracking-wider font-semibold font-sans text-[#6B6D73] flex items-center gap-1.5">
              <ListChecks className="w-3 h-3 text-[#6B9971]" />
              <span>Action Items</span>
            </div>
            <ul className="space-y-1 pl-1">
              {brief.actionItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-[#EDECE8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B9971] shrink-0 mt-1.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Deadline Section */}
        {brief.deadline && (
          <div className="space-y-1 pt-2 border-t border-[#2A2D33]">
            <div className="text-[10px] uppercase tracking-wider font-semibold font-sans text-[#6B6D73]">
              Deadline
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#14161A] border border-[#2A2D33] text-xs font-medium text-[#EDECE8]">
              <Clock className="w-3.5 h-3.5 text-[#6B9971]" />
              <span>{brief.deadline}</span>
            </div>
          </div>
        )}

        {/* Key Points Section */}
        {hasKeyPoints && (
          <div className="space-y-1.5 pt-2 border-t border-[#2A2D33]">
            <div className="text-[10px] uppercase tracking-wider font-semibold font-sans text-[#6B6D73]">
              Key Points
            </div>
            <ul className="space-y-1 pl-1">
              {brief.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-[#9A9CA3]">
                  <span className="w-1 h-1 rounded-full bg-[#6B6D73] shrink-0 mt-1.5" />
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Reply Section */}
        {brief.suggestedReply && (
          <div className="space-y-2 pt-2 border-t border-[#2A2D33]">
            <div className="text-[10px] uppercase tracking-wider font-semibold font-sans text-[#6B6D73]">
              Suggested Reply
            </div>
            <div className="p-3 rounded-lg bg-[#14161A] border border-[#2A2D33] text-xs text-[#9A9CA3] italic leading-relaxed font-sans">
              "{brief.suggestedReply}"
            </div>
            <button
              type="button"
              onClick={() => handleDraftReplyClick(brief.suggestedReply!)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#6B9971] text-[#6B9971] hover:text-[#EDECE8] border border-[#6B9971]/60 font-medium text-xs transition-colors font-sans"
            >
              <MessageSquareReply className="w-3.5 h-3.5" />
              <span>Draft Reply</span>
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
