'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { ActionTimeline } from './ActionTimeline';
import { ConfirmationCard } from './ConfirmationCard';
import { Sparkles, Send, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { executeClientAIToolCall } from '@/lib/commands';

export function AssistantPanel() {
  const { actionTimeline, isAIExecuting, addTimelineStep, updateTimelineStep, clearTimeline, setIsAIExecuting, selectedEmailId } = useMailStore();
  const [prompt, setPrompt] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actionTimeline, isAIExecuting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isAIExecuting) return;

    const userQuery = prompt.trim();
    setPrompt('');

    setIsAIExecuting(true);
    const stepId = addTimelineStep('User Query', userQuery);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userQuery, currentOpenEmailId: selectedEmailId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Assistant processing failed');
      }

      const data = await response.json();
      updateTimelineStep(stepId, 'completed', userQuery);

      // Execute AI tool calls in the browser React environment so UI state updates!
      if (data.toolCalls && Array.isArray(data.toolCalls)) {
        for (const tc of data.toolCalls) {
          if (tc.name) {
            await executeClientAIToolCall(tc.name, tc.args);
          }
        }
      }
    } catch (err: any) {
      updateTimelineStep(stepId, 'failed', err.message || 'Unknown error occurred');
    } finally {
      setIsAIExecuting(false);
    }
  };

  const handleScenarioClick = (scenarioPrompt: string) => {
    setPrompt(scenarioPrompt);
  };

  return (
    <div className="bg-[#FAFAF8] w-80 lg:w-96 flex flex-col h-full border-l border-[#201F1B]/15 font-sans">
      {/* Panel Header */}
      <div className="p-3 border-b border-[#201F1B]/15 bg-[#FAFAF8] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#201F1B]" />
          <h2 className="text-xs font-semibold text-[#201F1B] tracking-tight">AI Assistant</h2>
        </div>

        <button
          onClick={clearTimeline}
          className="p-1 rounded text-[#201F1B]/60 hover:text-[#201F1B] hover:bg-[#201F1B]/5 transition-colors"
          title="Clear history"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Preset Scenarios (Sentence Case Paper Cards) */}
        {actionTimeline.length === 0 && (
          <div className="space-y-3 font-sans">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[#201F1B]/60">
              Preset AI Commands
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleScenarioClick('Find emails from Sarah about Q3 report from last week')}
                className="text-left p-2.5 rounded-md bg-[#FAFAF8] border border-[#201F1B]/15 hover:border-[#201F1B]/40 text-xs text-[#201F1B] transition-colors group font-sans"
              >
                <div className="font-medium text-[#201F1B]">Search by sender & date</div>
                <div className="text-[11px] text-[#201F1B]/60 mt-0.5">Find emails from Sarah about Q3 report from last week</div>
              </button>

              <button
                onClick={() => handleScenarioClick('Find all unread emails')}
                className="text-left p-2.5 rounded-md bg-[#FAFAF8] border border-[#201F1B]/15 hover:border-[#201F1B]/40 text-xs text-[#201F1B] transition-colors group font-sans"
              >
                <div className="font-medium text-[#201F1B]">Filter unread</div>
                <div className="text-[11px] text-[#201F1B]/60 mt-0.5">Find all unread emails</div>
              </button>

              <button
                onClick={() => handleScenarioClick('Draft a reply to the latest email saying "I will review this tomorrow"')}
                className="text-left p-2.5 rounded-md bg-[#FAFAF8] border border-[#201F1B]/15 hover:border-[#201F1B]/40 text-xs text-[#201F1B] transition-colors group font-sans"
              >
                <div className="font-medium text-[#201F1B]">Populate compose modal</div>
                <div className="text-[11px] text-[#201F1B]/60 mt-0.5">Draft a reply saying "I will review this tomorrow"</div>
              </button>

              <button
                onClick={() => handleScenarioClick('Send an email to alex@example.com with subject "Project Update" and body "All deliverables are ready for review."')}
                className="text-left p-2.5 rounded-md bg-[#FAFAF8] border border-[#201F1B]/15 hover:border-[#201F1B]/40 text-xs text-[#201F1B] transition-colors group font-sans"
              >
                <div className="font-medium text-[#201F1B]">Send email with confirmation</div>
                <div className="text-[11px] text-[#201F1B]/60 mt-0.5">Send email to alex@example.com</div>
              </button>

              <button
                onClick={() => handleScenarioClick('Search emails about invoice and reply to the sender with "Received, thanks!"')}
                className="text-left p-2.5 rounded-md bg-[#FAFAF8] border border-[#201F1B]/15 hover:border-[#201F1B]/40 text-xs text-[#201F1B] transition-colors group font-sans"
              >
                <div className="font-medium text-[#201F1B]">Multi-step tool chain</div>
                <div className="text-[11px] text-[#201F1B]/60 mt-0.5">Search emails about invoice and reply to sender</div>
              </button>
            </div>
          </div>
        )}

        {/* Action Timeline History */}
        <ActionTimeline />

        {/* Pending Authorization Card */}
        <ConfirmationCard />

        {/* Processing Indicator */}
        {isAIExecuting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 rounded-md bg-[#FAFAF8] border border-[#201F1B]/15 flex items-center gap-2.5 text-xs text-[#201F1B]/60 font-sans"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#201F1B] animate-spin" />
            Evaluating tool call trajectory...
          </motion.div>
        )}
      </div>

      {/* Bottom Command Bar */}
      <div className="p-3 border-t border-[#201F1B]/15 bg-[#FAFAF8] font-sans">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            placeholder="Command assistant..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full pl-3 pr-8 py-1.5 bg-transparent border-b border-[#201F1B]/15 text-xs text-[#201F1B] placeholder-[#201F1B]/60 focus:border-[#201F1B]/40 focus:outline-none transition-colors font-sans"
            disabled={isAIExecuting}
          />
          <button
            type="submit"
            disabled={isAIExecuting || !prompt.trim()}
            className="absolute right-0 p-1 text-[#201F1B] disabled:opacity-40 transition-opacity"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
