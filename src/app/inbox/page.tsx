'use client';

import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { InboxList } from '@/components/mail/InboxList';
import { EmailDetail } from '@/components/mail/EmailDetail';
import { AssistantPanel } from '@/components/assistant/AssistantPanel';
import { ComposeModal } from '@/components/mail/ComposeModal';
import { useMailStore } from '@/lib/store/useMailStore';

export default function InboxPage() {
  const { setEmails } = useMailStore();

  useEffect(() => {
    // Setup Server-Sent Events (SSE) listener for realtime push updates
    const eventSource = new EventSource('/api/sync/sse');

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'INBOX_UPDATED') {
          // Re-fetch email cache when new email arrives
          fetch('/api/mail/list')
            .then((res) => res.json())
            .then((d) => {
              if (d.emails) setEmails(d.emails);
            });
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [setEmails]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#FAFAF8] text-[#201F1B] selection:bg-[#24463A]/15 selection:text-[#24463A] font-sans">
      {/* App Navbar */}
      <Navbar />

      {/* Main 3-Pane Layout */}
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
