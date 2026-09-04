'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, UserCheck, LogOut, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMailStore } from '@/lib/store/useMailStore';

interface AccountUser {
  userId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

interface AccountMenuProps {
  user: AccountUser | null;
  onSessionChange?: () => void;
}

export function AccountMenu({ user, onSessionChange }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSwitchAccount = async () => {
    setIsOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      useMailStore.getState().resetStore();
      window.location.href = '/api/auth/google?prompt=select_account';
    }
  };

  const handleDisconnectAccount = async () => {
    setIsOpen(false);
    try {
      await fetch('/api/gmail/account', { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to disconnect account:', err);
    } finally {
      useMailStore.getState().resetStore();
      if (onSessionChange) {
        onSessionChange();
      } else {
        window.location.reload();
      }
    }
  };

  if (!user) {
    return (
      <a
        href="/api/auth/google"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#24282F] border border-[#2A2D33] text-[#9A9CA3] hover:text-[#EDECE8] text-xs font-medium transition-colors font-sans"
      >
        <ShieldAlert className="w-3.5 h-3.5 text-[#6B9971]" />
        <span>Connect Gmail Account</span>
      </a>
    );
  }

  return (
    <div className="relative font-sans" ref={menuRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1C1F24] border border-[#2A2D33] text-xs font-sans text-[#EDECE8] hover:border-[#3A3E47] transition-all duration-150 focus:outline-none"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#6B9971] shrink-0" title="Connected to Gmail" />
        <span className="font-medium truncate max-w-[180px] text-[#EDECE8] font-sans">{user.email}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#6B6D73] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute right-0 mt-1.5 w-64 bg-[#1C1F24] border border-[#2A2D33] rounded-lg shadow-xl overflow-hidden z-50 font-sans"
          >
            {/* Header: Active Session User */}
            <div className="p-3 border-b border-[#2A2D33] flex items-center gap-2 bg-[#1C1F24]">
              <span className="w-2 h-2 rounded-full bg-[#6B9971] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs text-[#EDECE8] truncate font-sans">{user.email}</div>
                {user.name && <div className="text-[11px] text-[#6B6D73] truncate font-sans">{user.name}</div>}
              </div>
            </div>

            {/* Muted Section Label */}
            <div className="px-3 pt-2.5 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6D73] font-sans">
                ACCOUNT
              </span>
            </div>

            {/* Action Items */}
            <div className="px-1 pb-1 space-y-0.5 font-sans">
              <button
                onClick={handleSwitchAccount}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-sans text-[#EDECE8] hover:bg-[#14161A] hover:text-[#EDECE8] transition-colors text-left"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#6B9971] shrink-0" />
                <span className="font-medium">Switch Google account</span>
              </button>

              <button
                onClick={handleDisconnectAccount}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-sans text-[#9A9CA3] hover:bg-[#14161A] hover:text-[#EDECE8] transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5 text-[#6B6D73] shrink-0" />
                <span className="font-medium">Disconnect account</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
