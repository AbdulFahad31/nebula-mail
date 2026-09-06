'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { ActionTimeline } from './ActionTimeline';
import { ConfirmationCard } from './ConfirmationCard';
import { Sparkles, Send, Trash2, Search, Filter, PenSquare, SendHorizontal, Layers, PanelRightClose } from 'lucide-react';
import { motion } from 'framer-motion';
import { executeClientAIToolCall } from '@/lib/commands';

interface AssistantPanelProps {
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export function AssistantPanel({ onToggleCollapse, isCollapsed }: AssistantPanelProps = {}) {
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

  const presetScenarios = [
    {
      title: 'Find recent project updates',
      description: 'Search for emails from Sarah sent over the past week',
      prompt: 'Find emails from Sarah about Q3 report from last week',
      icon: Search,
    },
    {
      title: 'Show unread messages',
      description: 'Instantly filter your inbox down to unread mail',
      prompt: 'Find all unread emails',
      icon: Filter,
    },
    {
      title: 'Draft a quick response',
      description: 'Prepare a polite draft stating you will follow up tomorrow',
      prompt: 'Draft a reply to the latest email saying "I will review this tomorrow"',
      icon: PenSquare,
    },
    {
      title: 'Compose & send a message',
      description: 'Send a project signoff update directly to Alex',
      prompt: 'Send an email to alex@example.com with subject "Project Update" and body "All deliverables are ready for review."',
      icon: SendHorizontal,
    },
    {
      title: 'Find & reply automatically',
      description: 'Locate invoice correspondence and acknowledge receipt',
      prompt: 'Search emails about invoice and reply to the sender with "Received, thanks!"',
      icon: Layers,
    },
  ];

  return (
    <div className="bg-[#14161A] w-full flex flex-col h-full border-l border-[#2A2D33] font-sans transition-colors duration-150 min-w-0">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-[#2A2D33] bg-[#14161A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#6B9971]" />
          <h2 className="text-[11px] font-sans font-semibold text-[#6B6D73]">
            AI Assistant
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearTimeline}
            className="p-1 rounded text-[#6B6D73] hover:text-[#EDECE8] hover:bg-[#1C1F24] transition-colors"
            title="Clear history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded text-[#6B6D73] hover:text-[#EDECE8] hover:bg-[#1C1F24] transition-colors"
              title="Collapse Assistant Panel"
            >
              <PanelRightClose className="w-3.5 h-3.5 text-[#6B6D73] hover:text-[#6B9971]" />
            </button>
          )}
        </div>
      </div>

      {/* Main Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Raycast / Linear Style Divided Command Palette List */}
        {actionTimeline.length === 0 && (
          <div className="space-y-2 font-sans">
            <div className="text-[11px] font-sans font-semibold text-[#6B6D73] px-1">
              Preset AI commands
            </div>

            <div className="divide-y divide-[#2A2D33] border-y border-[#2A2D33]">
              {presetScenarios.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.12, delay: idx * 0.03 }}
                    onClick={() => handleScenarioClick(item.prompt)}
                    className="w-full text-left py-2.5 px-2 hover:bg-[#1C1F24] transition-colors flex items-center gap-3 group font-sans cursor-pointer"
                  >
                    {/* Icon sitting directly on background, monoline style, consistent 18px size */}
                    <IconComponent className="w-[18px] h-[18px] stroke-[1.5] text-[#6B6D73] group-hover:text-[#6B9971] transition-colors shrink-0" />

                    <div className="flex-1 min-w-0 font-sans">
                      <div className="text-xs font-sans font-medium text-[#EDECE8] group-hover:text-[#EDECE8] transition-colors leading-tight">
                        {item.title}
                      </div>
                      <div className="text-[11px] font-sans font-normal text-[#6B6D73] truncate leading-tight mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
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
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-md bg-[#1C1F24] border border-[#2A2D33] flex items-center gap-2.5 text-xs text-[#9A9CA3] font-sans"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#6B9971] animate-spin" />
            Evaluating tool call trajectory...
          </motion.div>
        )}
      </div>

      {/* Bottom Command Bar */}
      <div className="p-3.5 border-t border-[#2A2D33] bg-[#14161A] font-sans">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            placeholder="Command assistant..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-[#1C1F24] border border-[#2A2D33] rounded-md text-xs text-[#EDECE8] placeholder-[#6B6D73] focus:border-[#6B9971]/60 focus:outline-none transition-colors font-sans"
            disabled={isAIExecuting}
          />
          <button
            type="submit"
            disabled={isAIExecuting || !prompt.trim()}
            className="absolute right-2 p-1 text-[#6B6D73] hover:text-[#6B9971] disabled:opacity-30 transition-all duration-150"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
