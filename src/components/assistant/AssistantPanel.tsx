'use client';

import React, { useState } from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { ActionTimeline } from './ActionTimeline';
import { ConfirmationCard } from './ConfirmationCard';
import { Bot, Send, Sparkles, Command, ArrowRight, CornerDownLeft } from 'lucide-react';

export function AssistantPanel() {
  const { selectedEmailId, setIsAIExecuting, isAIExecuting, clearTimeline } = useMailStore();
  const [promptInput, setPromptInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: "Hello! I am your AI UI Controller. Give me natural instructions and I will operate the mail application's UI directly.",
    },
  ]);

  const handleSendPrompt = async (textToSend?: string) => {
    const query = textToSend || promptInput;
    if (!query.trim() || isAIExecuting) return;

    setPromptInput('');
    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    setIsAIExecuting(true);
    clearTimeline();

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          currentOpenEmailId: selectedEmailId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: data.reply || 'Request completed.' },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'Error executing request. Please try again.' },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Error: ${err.message || 'AI request failed'}` },
      ]);
    } finally {
      setIsAIExecuting(false);
    }
  };

  const handlePresetClick = (scenarioText: string) => {
    handleSendPrompt(scenarioText);
  };

  return (
    <div className="w-80 lg:w-96 h-full bg-slate-900/60 border-l border-slate-800/80 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              AI Controller
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-400">Operating UI directly</div>
          </div>
        </div>

        <div className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-mono">
          Gemini 2.5
        </div>
      </div>

      {/* Main Stream & Timeline */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Scenario Presets */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Evaluation Scenarios
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              onClick={() =>
                handlePresetClick(
                  "Send an email to john@example.com with subject Meeting Tomorrow and body Let's meet at 3pm."
                )
              }
              className="text-left p-2 rounded-lg bg-slate-950/50 hover:bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors flex items-center justify-between group"
            >
              <span>1. Compose & send meeting to John</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
            </button>

            <button
              onClick={() => handlePresetClick('Show me emails from the last 10 days.')}
              className="text-left p-2 rounded-lg bg-slate-950/50 hover:bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors flex items-center justify-between group"
            >
              <span>2. Filter emails from last 10 days</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
            </button>

            <button
              onClick={() =>
                handlePresetClick('Find the latest email from Sarah about the project update.')
              }
              className="text-left p-2 rounded-lg bg-slate-950/50 hover:bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors flex items-center justify-between group"
            >
              <span>3. Search & open Sarah's email</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
            </button>

            <button
              onClick={() => handlePresetClick("Reply that I'll handle it tomorrow.")}
              className="text-left p-2 rounded-lg bg-slate-950/50 hover:bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors flex items-center justify-between group"
            >
              <span>4. Context-aware reply to open email</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
            </button>

            <button
              onClick={() => handlePresetClick('Show only unread emails from this week.')}
              className="text-left p-2 rounded-lg bg-slate-950/50 hover:bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300 hover:text-cyan-300 transition-colors flex items-center justify-between group"
            >
              <span>5. Filter unread emails from this week</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
            </button>
          </div>
        </div>

        {/* Live Timeline Step List */}
        <ActionTimeline />

        {/* Human Confirmation Card */}
        <ConfirmationCard />

        {/* Chat History Messages */}
        <div className="space-y-3 pt-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-slate-800 text-slate-100 ml-6 border border-slate-700/60'
                  : 'bg-slate-950/80 text-cyan-200 mr-4 border border-cyan-900/40 font-medium'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            placeholder="Type natural instruction..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            disabled={isAIExecuting}
            className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!promptInput.trim() || isAIExecuting}
            className="absolute right-2 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-40 transition-all"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
