import { describe, it, expect, beforeEach } from 'vitest';
import { useMailStore } from '@/lib/store/useMailStore';
import { commandApplyFilter, commandPopulateCompose, commandOpenCompose } from '@/lib/commands/index';

describe('Shared Application Command Layer', () => {
  beforeEach(() => {
    useMailStore.getState().clearAllFilters();
    useMailStore.getState().closeComposeModal();
    useMailStore.getState().clearTimeline();
  });

  it('updates filterState and adds timeline step on commandApplyFilter', async () => {
    const res = await commandApplyFilter({ isUnread: true, sender: 'Sarah' });
    expect(res.success).toBe(true);

    const state = useMailStore.getState();
    expect(state.filterState.isUnread).toBe(true);
    expect(state.filterState.sender).toBe('Sarah');
    expect(state.actionTimeline.length).toBeGreaterThan(0);
  });

  it('opens compose modal and populates fields on commandPopulateCompose', async () => {
    const res = await commandPopulateCompose({
      to: ['john@example.com'],
      subject: 'Meeting Tomorrow',
      body: "Let's meet at 3pm.",
    });

    expect(res.success).toBe(true);
    const state = useMailStore.getState();
    expect(state.composeState.isOpen).toBe(true);
    expect(state.composeState.to).toContain('john@example.com');
    expect(state.composeState.subject).toBe('Meeting Tomorrow');
  });
});
