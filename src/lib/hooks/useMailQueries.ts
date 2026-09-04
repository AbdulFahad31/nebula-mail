'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMailStore } from '@/lib/store/useMailStore';
import { EmailMessage, ComposeDraft } from '@/lib/gmail/types';

export function useEmails() {
  const activeView = useMailStore((s) => s.activeView);
  const filterState = useMailStore((s) => s.filterState);

  return useQuery<EmailMessage[]>({
    queryKey: ['emails', activeView, filterState],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.set('view', activeView);
      if (filterState.keyword) queryParams.set('keyword', filterState.keyword);
      if (filterState.sender) queryParams.set('sender', filterState.sender);
      if (filterState.isUnread !== undefined) queryParams.set('isUnread', String(filterState.isUnread));
      if (filterState.startDate) queryParams.set('startDate', filterState.startDate);
      if (filterState.endDate) queryParams.set('endDate', filterState.endDate);

      const res = await fetch(`/api/mail/list?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch correspondence');
      const data = await res.json();
      return data.emails || [];
    },
  });
}

export function useEmailDetail(messageId: string | null) {
  return useQuery<EmailMessage | null>({
    queryKey: ['email', messageId],
    queryFn: async () => {
      if (!messageId) return null;
      const res = await fetch(`/api/mail/${messageId}`);
      if (!res.ok) throw new Error('Failed to fetch message details');
      const data = await res.json();
      return data.email || null;
    },
    enabled: !!messageId,
  });
}

export function useSendEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: { to: string[]; subject: string; body: string; threadId?: string }) => {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send email');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });
}
