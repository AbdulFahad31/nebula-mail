'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { InboxList } from '@/components/mail/InboxList';
import { EmailDetail } from '@/components/mail/EmailDetail';
import { AssistantPanel } from '@/components/assistant/AssistantPanel';
import { ComposeModal } from '@/components/mail/ComposeModal';
import { useMailStore } from '@/lib/store/useMailStore';
import {
  PanelLeftOpen,
  PanelRightOpen,
  Inbox,
  Send,
  Trash2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

const STORAGE_KEY = 'nebula_workspace_panel_layout_v3';

interface PanelLayoutState {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  leftWidth: number;
  rightWidth: number;
}

const DEFAULT_STATE: PanelLayoutState = {
  leftCollapsed: false,
  rightCollapsed: false,
  leftWidth: 320,
  rightWidth: 340,
};

export default function InboxPage() {
  const queryClient = useQueryClient();
  const { activeView, setActiveView } = useMailStore();

  const [layoutState, setLayoutState] = useState<PanelLayoutState>(DEFAULT_STATE);
  const [mounted, setMounted] = useState(false);

  // Load localStorage on client mount ONLY (prevents Next.js SSR hydration mismatch)
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setLayoutState({
          leftCollapsed: Boolean(parsed.leftCollapsed),
          rightCollapsed: Boolean(parsed.rightCollapsed),
          leftWidth: typeof parsed.leftWidth === 'number' ? Math.max(220, Math.min(460, parsed.leftWidth)) : 320,
          rightWidth: typeof parsed.rightWidth === 'number' ? Math.max(240, Math.min(500, parsed.rightWidth)) : 340,
        });
      }
    } catch (e) {}
  }, []);

  // Save localStorage when layoutState changes (after mounted)
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutState));
    } catch (e) {}
  }, [layoutState, mounted]);

  useEffect(() => {
    const eventSource = new EventSource('/api/sync/sse');
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'INBOX_UPDATED') {
          queryClient.invalidateQueries({ queryKey: ['emails'] });
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };
    return () => {
      eventSource.close();
    };
  }, [queryClient]);

  const toggleLeft = useCallback(() => {
    setLayoutState((prev) => ({ ...prev, leftCollapsed: !prev.leftCollapsed }));
  }, []);

  const toggleRight = useCallback(() => {
    setLayoutState((prev) => ({ ...prev, rightCollapsed: !prev.rightCollapsed }));
  }, []);

  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);

  const handleLeftMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingLeft.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingLeft.current) return;
      const newWidth = Math.max(220, Math.min(460, moveEvent.clientX));
      setLayoutState((prev) => ({ ...prev, leftWidth: newWidth }));
    };

    const onMouseUp = () => {
      isDraggingLeft.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleRightMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRight.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRight.current) return;
      const newWidth = Math.max(240, Math.min(500, window.innerWidth - moveEvent.clientX));
      setLayoutState((prev) => ({ ...prev, rightWidth: newWidth }));
    };

    const onMouseUp = () => {
      isDraggingRight.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: [
      layoutState.leftCollapsed ? '48px' : `${layoutState.leftWidth}px`,
      layoutState.leftCollapsed ? '0px' : '4px',
      'minmax(0, 1fr)',
      layoutState.rightCollapsed ? '0px' : '4px',
      layoutState.rightCollapsed ? '48px' : `${layoutState.rightWidth}px`,
    ].join(' '),
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    transition: 'grid-template-columns 200ms cubic-bezier(0.2, 0, 0, 1)',
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#14161A] text-[#EDECE8] selection:bg-[#6B9971]/25 selection:text-[#EDECE8] font-sans">
      <Navbar />
      <div className="flex-1 overflow-hidden relative">
        <div style={gridStyle}>
          {/* Column 1: Left Panel */}
          {layoutState.leftCollapsed ? (
            <LeftCollapsedRail onExpand={toggleLeft} />
          ) : (
            <div className="h-full min-w-0 flex flex-col overflow-hidden">
              <InboxList onToggleCollapse={toggleLeft} />
            </div>
          )}

          {/* Column 2: Left Drag Resize Handle */}
          {!layoutState.leftCollapsed ? (
            <div
              onMouseDown={handleLeftMouseDown}
              onDoubleClick={() => setLayoutState((prev) => ({ ...prev, leftWidth: 320 }))}
              className="relative flex items-center justify-center w-full h-full cursor-col-resize group z-20 select-none"
              title="Drag to resize mail list (Double-click to reset)"
            >
              <div className="w-[1px] h-full bg-[#2A2D33] group-hover:bg-[#6B9971] group-active:bg-[#6B9971] transition-colors duration-150" />
            </div>
          ) : (
            <div />
          )}

          {/* Column 3: Center Reading Pane (PRIMARY WORKSPACE - minmax(0, 1fr)) */}
          <div className="h-full min-w-0 flex flex-col overflow-hidden bg-[#14161A]">
            <EmailDetail />
          </div>

          {/* Column 4: Right Drag Resize Handle */}
          {!layoutState.rightCollapsed ? (
            <div
              onMouseDown={handleRightMouseDown}
              onDoubleClick={() => setLayoutState((prev) => ({ ...prev, rightWidth: 340 }))}
              className="relative flex items-center justify-center w-full h-full cursor-col-resize group z-20 select-none"
              title="Drag to resize AI assistant (Double-click to reset)"
            >
              <div className="w-[1px] h-full bg-[#2A2D33] group-hover:bg-[#6B9971] group-active:bg-[#6B9971] transition-colors duration-150" />
            </div>
          ) : (
            <div />
          )}

          {/* Column 5: Right AI Assistant Panel */}
          {layoutState.rightCollapsed ? (
            <RightCollapsedRail onExpand={toggleRight} />
          ) : (
            <div className="h-full min-w-0 flex flex-col overflow-hidden">
              <AssistantPanel onToggleCollapse={toggleRight} />
            </div>
          )}
        </div>
      </div>
      <ComposeModal />
    </div>
  );
}

function LeftCollapsedRail({ onExpand }: { onExpand: () => void }) {
  const { activeView, setActiveView } = useMailStore();

  return (
    <div
      onClick={onExpand}
      className="w-12 h-full bg-[#14161A] border-r border-[#2A2D33] flex flex-col items-center py-3 gap-4 cursor-pointer hover:bg-[#1C1F24]/50 transition-colors select-none group z-10"
      title="Click to expand Mail Navigation"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onExpand();
        }}
        className="p-2 rounded-md text-[#6B6D73] hover:text-[#EDECE8] hover:bg-[#1C1F24] transition-colors"
        title="Expand Mail Navigation"
      >
        <PanelLeftOpen className="w-4 h-4 text-[#6B9971]" />
      </button>

      <div className="w-6 h-[1px] bg-[#2A2D33] my-1" />

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveView('inbox');
          }}
          className={`p-2 rounded-md transition-colors ${
            activeView === 'inbox'
              ? 'bg-[#1C1F24] text-[#EDECE8] border border-[#6B9971]/40'
              : 'text-[#6B6D73] hover:text-[#EDECE8] hover:bg-[#1C1F24]'
          }`}
          title="Inbox"
        >
          <Inbox className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveView('sent');
          }}
          className={`p-2 rounded-md transition-colors ${
            activeView === 'sent'
              ? 'bg-[#1C1F24] text-[#EDECE8] border border-[#6B9971]/40'
              : 'text-[#6B6D73] hover:text-[#EDECE8] hover:bg-[#1C1F24]'
          }`}
          title="Sent"
        >
          <Send className="w-4 h-4" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveView('trash');
          }}
          className={`p-2 rounded-md transition-colors ${
            activeView === 'trash'
              ? 'bg-[#1C1F24] text-[#EDECE8] border border-[#6B9971]/40'
              : 'text-[#6B6D73] hover:text-[#EDECE8] hover:bg-[#1C1F24]'
          }`}
          title="Trash"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-auto flex flex-col items-center">
        <ChevronRight className="w-4 h-4 text-[#6B6D73] group-hover:text-[#6B9971] transition-colors" />
      </div>
    </div>
  );
}

function RightCollapsedRail({ onExpand }: { onExpand: () => void }) {
  return (
    <div
      onClick={onExpand}
      className="w-12 h-full bg-[#14161A] border-l border-[#2A2D33] flex flex-col items-center py-3 gap-4 cursor-pointer hover:bg-[#1C1F24]/50 transition-colors select-none group z-10"
      title="Click to expand AI Assistant"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onExpand();
        }}
        className="p-2 rounded-md text-[#6B6D73] hover:text-[#EDECE8] hover:bg-[#1C1F24] transition-colors"
        title="Expand AI Assistant"
      >
        <PanelRightOpen className="w-4 h-4 text-[#6B9971]" />
      </button>

      <div className="w-6 h-[1px] bg-[#2A2D33] my-1" />

      <div className="relative p-2 rounded-md bg-[#1C1F24] border border-[#2A2D33] group-hover:border-[#6B9971]/60 transition-colors">
        <Sparkles className="w-4 h-4 text-[#6B9971]" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#6B9971] animate-pulse" />
      </div>

      <div className="mt-auto flex flex-col items-center">
        <ChevronLeft className="w-4 h-4 text-[#6B9971] group-hover:text-[#EDECE8] transition-colors" />
      </div>
    </div>
  );
}
