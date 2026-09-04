'use client';

import React, { useEffect, useState } from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { EmailRow } from './EmailRow';
import { SmartFilterChips } from './SmartFilterChips';
import { Search, Inbox, Send, RefreshCw } from 'lucide-react';
import { commandSearchEmails } from '@/lib/commands';

export function InboxList() {
  const { activeView, setActiveView, emails, setEmails, filterState, setFilterState } = useMailStore();
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('view', activeView);
      if (filterState.keyword) queryParams.set('keyword', filterState.keyword);
      if (filterState.sender) queryParams.set('sender', filterState.sender);
      if (filterState.isUnread !== undefined) queryParams.set('isUnread', String(filterState.isUnread));
      if (filterState.startDate) queryParams.set('startDate', filterState.startDate);
      if (filterState.endDate) queryParams.set('endDate', filterState.endDate);

      const res = await fetch(`/api/mail/list?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      }
    } catch (err) {
      console.error('Fetch emails error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [activeView, filterState]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    commandSearchEmails({ keyword: searchInput.trim() });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/60 border-r border-slate-800/80">
      {/* Header & Search Bar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('inbox')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'inbox'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              Inbox
            </button>
            <button
              onClick={() => setActiveView('sent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'sent'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Sent
            </button>
          </div>

          <button
            onClick={fetchEmails}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/50 transition-colors"
            title="Refresh emails"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search keywords, sender, or date..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
          />
        </form>
      </div>

      {/* Shared Smart Filter Chips */}
      <SmartFilterChips />

      {/* Email Row List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {isLoading && emails.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading messages...</div>
        ) : emails.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No emails found matching filters</div>
        ) : (
          emails.map((email) => <EmailRow key={email.id} email={email} />)
        )}
      </div>
    </div>
  );
}
