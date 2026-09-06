'use client';

import React, { useEffect, useState } from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { useEmails, useSyncRefreshMutation } from '@/lib/hooks/useMailQueries';
import { EmailRow } from './EmailRow';
import { SmartFilterChips } from './SmartFilterChips';
import { Search, RefreshCw, PanelLeftClose } from 'lucide-react';
import { commandSearchEmails } from '@/lib/commands';

interface InboxListProps {
  onToggleCollapse?: () => void;
}

export function InboxList({ onToggleCollapse }: InboxListProps = {}) {
  const { activeView, setActiveView, setEmails } = useMailStore();
  const [searchInput, setSearchInput] = useState('');

  // TanStack Query for server state & sync state
  const { data: emailsData, isLoading, refetch } = useEmails();
  const syncRefresh = useSyncRefreshMutation();

  const emails = emailsData || [];

  // 1. POLLING FALLBACK: Poll Gmail API sync endpoint every 20 seconds silently in the background
  useEffect(() => {
    // Initial sync check on mount
    syncRefresh.mutate();

    const interval = setInterval(() => {
      syncRefresh.mutate();
    }, 20000); // 20s interval fallback for local dev / missed push webhooks

    return () => clearInterval(interval);
  }, []);

  // Sync to store for instant command access
  useEffect(() => {
    if (emailsData) {
      setEmails(emailsData);
    }
  }, [emailsData, setEmails]);

  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleManualRefresh = async () => {
    setIsManualSyncing(true);
    try {
      await syncRefresh.mutateAsync();
      await refetch();
    } catch (e) {
      console.error('Manual refresh error:', e);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    commandSearchEmails({ keyword: searchInput.trim() });
  };

  return (
    <div className="flex flex-col h-full bg-[#14161A] border-r border-[#2A2D33] font-sans transition-colors duration-150 min-w-0">
      {/* Header Underline Tabs & Search */}
      <div className="px-3.5 py-3 border-b border-[#2A2D33] bg-[#14161A] space-y-2.5">
        <div className="flex items-center justify-between">
          {/* Plain Text Folder Tabs with Accent Underline Indicator */}
          <div className="flex items-center gap-4 text-xs font-sans">
            <button
              onClick={() => setActiveView('inbox')}
              className={`pb-1 transition-colors ${
                activeView === 'inbox'
                  ? 'border-b-2 border-[#6B9971] text-[#EDECE8] font-medium'
                  : 'text-[#9A9CA3] hover:text-[#EDECE8] font-normal'
              }`}
            >
              Inbox
            </button>
            <button
              onClick={() => setActiveView('sent')}
              className={`pb-1 transition-colors ${
                activeView === 'sent'
                  ? 'border-b-2 border-[#6B9971] text-[#EDECE8] font-medium'
                  : 'text-[#9A9CA3] hover:text-[#EDECE8] font-normal'
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setActiveView('trash')}
              className={`pb-1 transition-colors ${
                activeView === 'trash'
                  ? 'border-b-2 border-[#6B9971] text-[#EDECE8] font-medium'
                  : 'text-[#9A9CA3] hover:text-[#EDECE8] font-normal'
              }`}
            >
              Trash
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleManualRefresh}
              disabled={isManualSyncing}
              className="p-1 text-[#6B6D73] hover:text-[#EDECE8] transition-colors disabled:opacity-50"
              title="Refresh messages"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin text-[#6B9971]' : ''}`} />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 text-[#6B6D73] hover:text-[#EDECE8] hover:bg-[#1C1F24] rounded transition-colors"
                title="Collapse Mail Navigation"
              >
                <PanelLeftClose className="w-3.5 h-3.5 text-[#6B6D73] hover:text-[#6B9971]" />
              </button>
            )}
          </div>
        </div>

        {/* Minimalist Input with Subtle Border */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#6B6D73]" />
          <input
            type="text"
            placeholder="Search correspondence..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 bg-[#1C1F24] border border-[#2A2D33] rounded-md text-xs text-[#EDECE8] placeholder-[#6B6D73] focus:border-[#6B9971]/60 focus:outline-none transition-colors font-sans"
          />
        </form>
      </div>

      {/* Shared Smart Filter Chips */}
      <SmartFilterChips />

      {/* Email List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#2A2D33]">
        {isLoading && emails.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#6B6D73] font-sans">Loading correspondence...</div>
        ) : emails.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#6B6D73] font-sans">No correspondence matches active filters</div>
        ) : (
          emails.map((email) => <EmailRow key={email.id} email={email} />)
        )}
      </div>
    </div>
  );
}
