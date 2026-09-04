'use client';

import React, { useEffect, useState } from 'react';
import { PenSquare, ShieldAlert } from 'lucide-react';
import { commandOpenCompose } from '@/lib/commands';

export function Navbar() {
  const [user, setUser] = useState<any>(null);

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
    <header className="h-12 bg-[#14161A] border-b border-[#2A2D33] px-4 flex items-center justify-between shrink-0 font-sans transition-colors duration-150">
      {/* Brand Wordmark (Fraunces Serif Semibold) */}
      <div className="flex items-center gap-2.5">
        <span className="font-serif-display text-[17px] font-semibold text-[#EDECE8] tracking-[-0.01em]">
          Nebula Mail
        </span>
      </div>

      {/* Actions & Account Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => commandOpenCompose()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#24282F] text-[#6B9971] hover:text-[#EDECE8] border border-[#6B9971]/40 hover:border-[#6B9971]/80 text-xs font-medium font-sans transition-all duration-150"
        >
          <PenSquare className="w-3.5 h-3.5 text-[#6B9971]" />
          New Message
        </button>

        {user ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1C1F24] border border-[#2A2D33] text-xs font-sans text-[#EDECE8] hover:border-[#3A3E47] transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6B9971]" title="Connected to Gmail" />
            <span className="font-medium truncate max-w-[180px] text-[#EDECE8]">{user.email}</span>
          </div>
        ) : (
          <a
            href="/api/auth/google"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#24282F] border border-[#2A2D33] text-[#9A9CA3] hover:text-[#EDECE8] text-xs font-medium transition-colors font-sans"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#6B9971]" />
            <span>Connect Gmail Account</span>
          </a>
        )}
      </div>
    </header>
  );
}



