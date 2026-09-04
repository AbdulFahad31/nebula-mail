'use client';

import React, { useEffect, useState } from 'react';
import { PenSquare, ShieldAlert, Check } from 'lucide-react';
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
    <header className="h-12 bg-[#FAFAF8] border-b border-[#201F1B]/15 px-4 flex items-center justify-between shrink-0 font-sans">
      {/* Wordmark Logo Alone (Source Serif 4 Semibold, Ink Color) */}
      <div className="flex items-center">
        <span className="font-serif-display text-lg font-semibold text-[#201F1B] tracking-tight">
          Nebula Mail
        </span>
      </div>

      {/* Actions & Account Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => commandOpenCompose()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#24463A] hover:bg-[#1C372E] text-[#FAFAF8] text-xs font-medium transition-colors font-sans"
        >
          <PenSquare className="w-3.5 h-3.5" />
          New Message
        </button>

        {user ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAFAF8] border border-[#201F1B]/15 text-[#201F1B]/60 text-xs font-sans">
            <Check className="w-3.5 h-3.5 text-[#24463A]" />
            <span className="text-[#201F1B] font-medium">{user.email}</span>
          </div>
        ) : (
          <a
            href="/api/auth/google"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAFAF8] hover:bg-[#201F1B]/5 border border-[#201F1B]/15 text-[#201F1B]/60 hover:text-[#201F1B] text-xs font-medium transition-colors font-sans"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>Connect Gmail Account</span>
          </a>
        )}
      </div>
    </header>
  );
}
