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
    <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2 bg-[#14161A] border-b border-[#2A2D33] text-xs font-sans transition-colors duration-150">
      <span className="text-[#6B6D73] font-normal text-xs">Active filters:</span>
      <AnimatePresence>
        {activeChips.map((chip) => (
          <motion.span
            key={chip.key}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#1C1F24] border border-[#2A2D33] text-[#EDECE8] font-medium text-[11px] font-sans"
          >
            {chip.label}
            <button
              onClick={() => clearFilter(chip.key as any)}
              className="p-0.5 hover:text-[#6B9971] transition-colors"
              title="Remove filter"
            >
              <X className="w-3 h-3 text-[#6B6D73] hover:text-[#EDECE8]" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <button
        onClick={clearAllFilters}
        className="ml-auto text-[#6B6D73] hover:text-[#6B9971] text-xs flex items-center gap-1 transition-colors font-sans"
      >
        <FilterX className="w-3 h-3" />
        Clear
      </button>
    </div>
  );
}

