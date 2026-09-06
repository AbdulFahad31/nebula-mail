'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PenSquare } from 'lucide-react';
import { commandOpenCompose } from '@/lib/commands';
import { AccountMenu } from './AccountMenu';

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSession = useCallback(() => {
    setIsLoading(true);
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return (
    <header className="h-12 bg-[#14161A] border-b border-[#2A2D33] px-4 flex items-center justify-between shrink-0 font-sans transition-colors duration-150">
      {/* Brand Wordmark (Source Serif 4 Semibold) */}
      <div className="flex items-center gap-2.5">
        <span className="font-serif-display text-[17px] font-semibold text-[#EDECE8] tracking-[-0.01em]">
          Nebula Mail
        </span>
      </div>

      {/* Actions & Account Status Dropdown */}
      <div className="flex items-center gap-3 font-sans">
        <button
          onClick={() => commandOpenCompose()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#24282F] text-[#6B9971] hover:text-[#EDECE8] border border-[#6B9971]/40 hover:border-[#6B9971]/80 text-xs font-medium font-sans transition-all duration-150"
        >
          <PenSquare className="w-3.5 h-3.5 text-[#6B9971]" />
          New Message
        </button>

        {!isLoading && (
          <AccountMenu user={user} onSessionChange={fetchSession} />
        )}
      </div>
    </header>
  );
}



