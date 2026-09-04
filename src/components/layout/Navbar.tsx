'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, PenSquare, LogIn, LogOut, CheckCircle2, ShieldAlert } from 'lucide-react';
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
    <header className="h-14 bg-slate-950/80 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
          <Sparkles className="w-4 h-4 fill-slate-950 stroke-none" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-serif-display text-xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-cyan-200 bg-clip-text text-transparent">
            Nebula Mail
          </span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
            AI-Controlled
          </span>
        </div>
      </div>

      {/* Center Action & OAuth Status Pill */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => commandOpenCompose()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-sm transition-all"
        >
          <PenSquare className="w-3.5 h-3.5" />
          Compose
        </button>

        {user ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{user.email}</span>
          </div>
        ) : (
          <a
            href="/api/auth/google"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-medium transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span>Connect Gmail OAuth</span>
          </a>
        )}
      </div>
    </header>
  );
}
