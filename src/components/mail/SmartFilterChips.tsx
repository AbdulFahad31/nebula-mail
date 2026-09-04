'use client';

import React from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { X, FilterX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SmartFilterChips() {
  const { filterState, clearFilter, clearAllFilters } = useMailStore();

  const activeChips: { key: string; label: string }[] = [];

  if (filterState.isUnread) {
    activeChips.push({ key: 'isUnread', label: 'Unread Only' });
  }

  if (filterState.sender) {
    activeChips.push({ key: 'sender', label: `From: ${filterState.sender}` });
  }

  if (filterState.keyword) {
    activeChips.push({ key: 'keyword', label: `Keyword: ${filterState.keyword}` });
  }

  if (filterState.startDate) {
    activeChips.push({ key: 'startDate', label: `After: ${filterState.startDate}` });
  }

  if (filterState.endDate) {
    activeChips.push({ key: 'endDate', label: `Before: ${filterState.endDate}` });
  }

  if (activeChips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
      <span className="text-slate-400 font-medium flex items-center gap-1">
        Active Filters:
      </span>
      <AnimatePresence>
        {activeChips.map((chip) => (
          <motion.span
            key={chip.key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-medium"
          >
            {chip.label}
            <button
              onClick={() => clearFilter(chip.key as any)}
              className="p-0.5 rounded-full hover:bg-cyan-800/50 text-cyan-400 hover:text-cyan-100 transition-colors"
              title="Remove filter"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <button
        onClick={clearAllFilters}
        className="ml-auto text-slate-400 hover:text-cyan-400 text-xs flex items-center gap-1 hover:underline transition-colors"
      >
        <FilterX className="w-3.5 h-3.5" />
        Clear All
      </button>
    </div>
  );
}
