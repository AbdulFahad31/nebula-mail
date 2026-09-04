'use client';

import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { InboxList } from '@/components/mail/InboxList';
import { EmailDetail } from '@/components/mail/EmailDetail';
import { AssistantPanel } from '@/components/assistant/AssistantPanel';
import { ComposeModal } from '@/components/mail/ComposeModal';

export default function InboxPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Setup Server-Sent Events (SSE) listener for realtime push updates
    const eventSource = new EventSource('/api/sync/sse');

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'INBOX_UPDATED') {
          // Invalidate TanStack Query cache to trigger instant re-fetch of server data
          queryClient.invalidateQueries({ queryKey: ['emails'] });
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#14161A] text-[#EDECE8] selection:bg-[#6B9971]/25 selection:text-[#EDECE8] font-sans">
      {/* App Navbar */}
      <Navbar />

      {/* Main 4-Column Layout Architecture */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pane 1: Inbox List & Search Filters */}
        <div className="w-80 md:w-96 h-full shrink-0">
          <InboxList />
        </div>

        {/* Pane 2: Reading View */}
        <div className="flex-1 h-full min-w-0">
          <EmailDetail />
        </div>

        {/* Pane 3: Native Assistant Inspector Pane */}
        <AssistantPanel />
      </div>

      {/* Compose Drawer Modal */}
      <ComposeModal />
    </div>
  );
}



