import { create } from 'zustand';
import { EmailMessage, EmailFilterParams, ComposeDraft } from '@/lib/gmail/types';

export interface TimelineStep {
  id: string;
  stepName: string;
  details?: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: string;
}

export interface ConfirmationModalState {
  id: string;
  type: 'send' | 'reply' | 'forward';
  title: string;
  summary: string;
  payload: {
    to: string[];
    subject: string;
    body: string;
    messageId?: string;
    threadId?: string;
  };
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

interface MailStoreState {
  // Navigation & Data
  activeView: 'inbox' | 'sent';
  emails: EmailMessage[];
  selectedEmailId: string | null;

  // Search & Filter (Smart Filter Chips)
  filterState: EmailFilterParams;

  // Compose Form Drawer
  composeState: {
    isOpen: boolean;
    draftId: string;
    to: string[];
    subject: string;
    body: string;
    replyToMessageId?: string;
    threadId?: string;
  };

  // AI Activity & Confirmation Cards
  actionTimeline: TimelineStep[];
  confirmationCard: ConfirmationModalState | null;
  isAIExecuting: boolean;

  // Secondary Dark Mode State (Item 6)
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Actions / Reducers
  setActiveView: (view: 'inbox' | 'sent') => void;
  setEmails: (emails: EmailMessage[]) => void;
  setSelectedEmailId: (id: string | null) => void;
  setFilterState: (filters: Partial<EmailFilterParams>) => void;
  clearFilter: (key: keyof EmailFilterParams) => void;
  clearAllFilters: () => void;
  setComposeState: (state: Partial<MailStoreState['composeState']>) => void;
  openComposeModal: () => void;
  closeComposeModal: () => void;

  // Timeline & Confirmation
  addTimelineStep: (stepName: string, details?: string) => string;
  updateTimelineStep: (id: string, status: 'completed' | 'failed', details?: string) => void;
  clearTimeline: () => void;
  setConfirmationCard: (card: ConfirmationModalState | null) => void;
  setIsAIExecuting: (executing: boolean) => void;
  resetStore: () => void;
}

export const useMailStore = create<MailStoreState>((set, get) => ({
  activeView: 'inbox',
  emails: [],
  selectedEmailId: null,

  filterState: {},

  composeState: {
    isOpen: false,
    draftId: 'draft_default',
    to: [],
    subject: '',
    body: '',
  },

  actionTimeline: [],
  confirmationCard: null,
  isAIExecuting: false,
  isDarkMode: false,

  resetStore: () =>
    set({
      activeView: 'inbox',
      emails: [],
      selectedEmailId: null,
      filterState: {},
      composeState: {
        isOpen: false,
        draftId: 'draft_default',
        to: [],
        subject: '',
        body: '',
      },
      actionTimeline: [],
      confirmationCard: null,
      isAIExecuting: false,
    }),

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.isDarkMode;
      if (typeof document !== 'undefined') {
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { isDarkMode: next };
    }),

  setActiveView: (view) => set({ activeView: view, selectedEmailId: null }),

  setEmails: (emails) => set({ emails }),


  setSelectedEmailId: (id) => set({ selectedEmailId: id }),

  setFilterState: (filters) =>
    set((state) => ({
      filterState: { ...state.filterState, ...filters },
    })),

  clearFilter: (key) =>
    set((state) => {
      const updated = { ...state.filterState };
      delete updated[key];
      return { filterState: updated };
    }),

  clearAllFilters: () => set({ filterState: {} }),

  setComposeState: (partial) =>
    set((state) => ({
      composeState: { ...state.composeState, ...partial },
    })),

  openComposeModal: () =>
    set((state) => ({
      composeState: { ...state.composeState, isOpen: true },
    })),

  closeComposeModal: () =>
    set((state) => ({
      composeState: {
        ...state.composeState,
        isOpen: false,
        to: [],
        subject: '',
        body: '',
        replyToMessageId: undefined,
        threadId: undefined,
      },
    })),

  addTimelineStep: (stepName, details) => {
    const id = `step_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const step: TimelineStep = {
      id,
      stepName,
      details,
      status: 'running',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    set((state) => ({
      actionTimeline: [...state.actionTimeline, step],
    }));
    return id;
  },

  updateTimelineStep: (id, status, details) =>
    set((state) => ({
      actionTimeline: state.actionTimeline.map((s) =>
        s.id === id ? { ...s, status, details: details || s.details } : s
      ),
    })),

  clearTimeline: () => set({ actionTimeline: [] }),

  setConfirmationCard: (card) => set({ confirmationCard: card }),

  setIsAIExecuting: (executing) => set({ isAIExecuting: executing }),
}));
