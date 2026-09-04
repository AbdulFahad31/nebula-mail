'use client';

import React, { useEffect, useState } from 'react';
import { PenSquare, ShieldAlert, Check, Moon, Sun } from 'lucide-react';
import { commandOpenCompose } from '@/lib/commands';
import { useMailStore } from '@/lib/store/useMailStore';

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const isDarkMode = useMailStore((s) => s.isDarkMode);
  const toggleDarkMode = useMailStore((s) => s.toggleDarkMode);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-12 bg-[#FAFAF8] dark:bg-[#1E1D1A] border-b border-[#201F1B]/15 dark:border-[#F4F4F0]/15 px-4 flex items-center justify-between shrink-0 font-sans transition-colors">
      {/* Wordmark Logo Alone (Source Serif 4 Semibold, Ink Color) */}
      <div className="flex items-center">
        <span className="font-serif-display text-lg font-semibold text-[#201F1B] dark:text-[#F4F4F0] tracking-tight">
          Nebula Mail
        </span>
      </div>

      {/* Actions & Account Status */}
      <div className="flex items-center gap-3">
        {/* Dark Mode Secondary Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-md border border-[#201F1B]/15 dark:border-[#F4F4F0]/15 text-[#201F1B]/70 dark:text-[#F4F4F0]/70 hover:text-[#201F1B] dark:hover:text-[#F4F4F0] transition-colors"
          title={isDarkMode ? 'Switch to Light Paper Mode' : 'Switch to Dark Ink Mode'}
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => commandOpenCompose()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#24463A] hover:bg-[#1C372E] text-[#FAFAF8] text-xs font-medium transition-colors font-sans"
        >
          <PenSquare className="w-3.5 h-3.5" />
          New Message
        </button>

        {user ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAFAF8] dark:bg-[#1E1D1A] border border-[#201F1B]/15 dark:border-[#F4F4F0]/15 text-[#201F1B]/60 dark:text-[#F4F4F0]/60 text-xs font-sans">
            <Check className="w-3.5 h-3.5 text-[#24463A]" />
            <span className="text-[#201F1B] dark:text-[#F4F4F0] font-medium">{user.email}</span>
          </div>
        ) : (
          <a
            href="/api/auth/google"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAFAF8] dark:bg-[#1E1D1A] hover:bg-[#201F1B]/5 border border-[#201F1B]/15 dark:border-[#F4F4F0]/15 text-[#201F1B]/60 dark:text-[#F4F4F0]/60 hover:text-[#201F1B] dark:hover:text-[#F4F4F0] text-xs font-medium transition-colors font-sans"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>Connect Gmail Account</span>
          </a>
        )}
      </div>
    </header>
  );
}

