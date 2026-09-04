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
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* App Navbar */}
      <Navbar />

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Inbox List & Filters (fixed width) */}
        <div className="w-80 md:w-96 h-full shrink-0">
          <InboxList />
        </div>

        {/* Column 2: Selected Email Detail View (flexible fill) */}
        <div className="flex-1 h-full min-w-0">
          <EmailDetail />
        </div>

        {/* Column 3: AI Assistant Controller Panel (fixed width) */}
        <AssistantPanel />
      </div>

      {/* Visibly Populated Compose Modal Drawer */}
      <ComposeModal />
    </div>
  );
}
