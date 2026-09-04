'use client';

import React, { useEffect, useState } from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { useEmails } from '@/lib/hooks/useMailQueries';
import { EmailRow } from './EmailRow';
import { SmartFilterChips } from './SmartFilterChips';
import { Search, RefreshCw } from 'lucide-react';
import { commandSearchEmails } from '@/lib/commands';

export function InboxList() {
  const { activeView, setActiveView, setEmails } = useMailStore();
  const [searchInput, setSearchInput] = useState('');

  // TanStack Query for server state
  const { data: emailsData, isLoading, refetch } = useEmails();
  const emails = emailsData || [];

  // Sync to store for instant command access
  useEffect(() => {
    if (emailsData) {
      setEmails(emailsData);
    }
  }, [emailsData, setEmails]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    commandSearchEmails({ keyword: searchInput.trim() });
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAF8] dark:bg-[#1E1D1A] border-r border-[#201F1B]/15 dark:border-[#F4F4F0]/15 font-sans transition-colors">
      {/* Header Underline Tabs & Bottom-Border Line Search */}
      <div className="px-3.5 py-3 border-b border-[#201F1B]/15 dark:border-[#F4F4F0]/15 bg-[#FAFAF8] dark:bg-[#1E1D1A] space-y-2.5">
        <div className="flex items-center justify-between">
          {/* Plain Text Folder Tabs with Bottle Green Underline Indicator */}
          <div className="flex items-center gap-4 text-xs font-sans">
            <button
              onClick={() => setActiveView('inbox')}
              className={`pb-1 transition-colors ${
                activeView === 'inbox'
                  ? 'border-b-2 border-[#24463A] dark:border-[#3E6D5B] text-[#201F1B] dark:text-[#F4F4F0] font-medium'
                  : 'text-[#201F1B]/60 dark:text-[#F4F4F0]/60 hover:text-[#201F1B] dark:hover:text-[#F4F4F0] font-normal'
              }`}
            >
              Inbox
            </button>
            <button
              onClick={() => setActiveView('sent')}
              className={`pb-1 transition-colors ${
                activeView === 'sent'
                  ? 'border-b-2 border-[#24463A] dark:border-[#3E6D5B] text-[#201F1B] dark:text-[#F4F4F0] font-medium'
                  : 'text-[#201F1B]/60 dark:text-[#F4F4F0]/60 hover:text-[#201F1B] dark:hover:text-[#F4F4F0] font-normal'
              }`}
            >
              Sent
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="p-1 text-[#201F1B]/60 dark:text-[#F4F4F0]/60 hover:text-[#201F1B] dark:hover:text-[#F4F4F0] transition-colors"
            title="Refresh messages"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#24463A] dark:text-[#3E6D5B]' : ''}`} />
          </button>
        </div>

        {/* Minimalist Line Input with Bottom Border */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-0 top-2 w-3.5 h-3.5 text-[#201F1B]/60 dark:text-[#F4F4F0]/60" />
          <input
            type="text"
            placeholder="Search correspondence..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-6 pr-2 py-1.5 bg-transparent border-b border-[#201F1B]/15 dark:border-[#F4F4F0]/15 text-xs text-[#201F1B] dark:text-[#F4F4F0] placeholder-[#201F1B]/60 dark:placeholder-[#F4F4F0]/60 focus:border-[#24463A] dark:focus:border-[#3E6D5B] focus:outline-none transition-colors font-sans"
          />
        </form>
      </div>

      {/* Shared Smart Filter Chips */}
      <SmartFilterChips />

      {/* Email List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#201F1B]/10 dark:divide-[#F4F4F0]/10">
        {isLoading && emails.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#201F1B]/60 dark:text-[#F4F4F0]/60 font-sans">Loading correspondence...</div>
        ) : emails.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#201F1B]/60 dark:text-[#F4F4F0]/60 font-sans">No correspondence matches active filters</div>
        ) : (
          emails.map((email) => <EmailRow key={email.id} email={email} />)
        )}
      </div>
    </div>
  );
}

