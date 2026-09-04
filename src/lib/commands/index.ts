import { useMailStore } from '@/lib/store/useMailStore';
import { EmailFilterParams, ComposeDraft } from '@/lib/gmail/types';

/**
 * Shared Application Command Layer
 * Pure functions called symmetrically by both UI human clicks and AI tool routines.
 */

export async function commandSearchEmails(params: {
  from?: string;
  to?: string;
  subject?: string;
  keyword?: string;
  after?: string;
  before?: string;
  isUnread?: boolean;
}) {
  const store = useMailStore.getState();
  const stepId = store.addTimelineStep('Searching emails', JSON.stringify(params));

  try {
    const filters: EmailFilterParams = {
      from: params.from,
      sender: params.from,
      to: params.to,
      subject: params.subject,
      keyword: params.keyword,
      after: params.after,
      before: params.before,
      isUnread: params.isUnread,
    };

    store.setFilterState(filters);

    // Fetch matching data via API endpoint
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.set('sender', params.from);
    if (params.keyword) queryParams.set('keyword', params.keyword);
    if (params.subject) queryParams.set('subject', params.subject);
    if (params.after) queryParams.set('startDate', params.after);
    if (params.before) queryParams.set('endDate', params.before);
    if (params.isUnread !== undefined) queryParams.set('isUnread', String(params.isUnread));

    const res = await fetch(`/api/mail/list?${queryParams.toString()}`);
    if (res.ok) {
      const data = await res.json();
      store.setEmails(data.emails || []);
      store.updateTimelineStep(stepId, 'completed', `Found ${data.emails?.length || 0} matching emails`);
      return { success: true, count: data.emails?.length || 0, emails: data.emails };
    } else {
      store.updateTimelineStep(stepId, 'failed', 'Search request failed');
      return { success: false, error: 'Failed to search' };
    }
  } catch (error: any) {
    store.updateTimelineStep(stepId, 'failed', error.message || 'Search error');
    return { success: false, error: error.message };
  }
}

export async function commandOpenEmail(params: { messageId: string }) {
  const store = useMailStore.getState();
  const stepId = store.addTimelineStep('Opening email', `Message ID: ${params.messageId}`);

  try {
    // If exact ID exists in current store, select it immediately
    const existing = store.emails.find(
      (e) => e.id === params.messageId || e.gmailMessageId === params.messageId
    );

    if (existing) {
      store.setSelectedEmailId(existing.id);
      store.updateTimelineStep(stepId, 'completed', `Opened "${existing.subject}"`);
      return { success: true, email: existing };
    }

    // Otherwise fetch email detail from API
    const res = await fetch(`/api/mail/${params.messageId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.email) {
        store.setSelectedEmailId(data.email.id);
        store.updateTimelineStep(stepId, 'completed', `Opened "${data.email.subject}"`);
        return { success: true, email: data.email };
      }
    }

    store.updateTimelineStep(stepId, 'failed', 'Email not found');
    return { success: false, error: 'Email not found' };
  } catch (error: any) {
    store.updateTimelineStep(stepId, 'failed', error.message);
    return { success: false, error: error.message };
  }
}

export async function commandApplyFilter(params: {
  isUnread?: boolean;
  sender?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}) {
  const store = useMailStore.getState();
  const stepId = store.addTimelineStep('Applying inbox filter', JSON.stringify(params));

  store.setFilterState({
    isUnread: params.isUnread,
    sender: params.sender,
    keyword: params.keyword,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  store.updateTimelineStep(stepId, 'completed', 'Updated filter chips & inbox list');
  return { success: true, filters: params };
}

export async function commandOpenCompose() {
  const store = useMailStore.getState();
  const stepId = store.addTimelineStep('Opening compose modal');

  store.openComposeModal();
  store.updateTimelineStep(stepId, 'completed');
  return { success: true };
}

export async function commandPopulateCompose(params: {
  to: string[];
  subject: string;
  body: string;
}) {
  const store = useMailStore.getState();
  const stepId = store.addTimelineStep(
    'Populating compose form',
    `To: ${params.to.join(', ')} | Subject: ${params.subject}`
  );

  store.openComposeModal();
  store.setComposeState({
    to: params.to,
    subject: params.subject,
    body: params.body,
  });

  store.updateTimelineStep(stepId, 'completed', 'Filled draft fields visibly');
  return { success: true };
}

export async function commandSendEmail(params: { composeDraftId: string }) {
  const store = useMailStore.getState();
  const draft = store.composeState;

  return new Promise<{ success: boolean; requiresConfirmation: boolean }>((resolve) => {
    store.setConfirmationCard({
      id: `conf_${Date.now()}`,
      type: 'send',
      title: 'Confirm Send Email',
      summary: `Send email to ${draft.to.join(', ')} with subject "${draft.subject}"?`,
      payload: {
        to: draft.to,
        subject: draft.subject,
        body: draft.body,
      },
      onConfirm: async () => {
        const stepId = store.addTimelineStep('Executing send email');
        try {
          const res = await fetch('/api/mail/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: draft.to,
              subject: draft.subject,
              body: draft.body,
              threadId: draft.threadId,
            }),
          });

          if (res.ok) {
            store.closeComposeModal();
            store.setConfirmationCard(null);
            store.updateTimelineStep(stepId, 'completed', 'Email successfully sent');
            resolve({ success: true, requiresConfirmation: false });
          } else {
            store.updateTimelineStep(stepId, 'failed', 'Send API failed');
            resolve({ success: false, requiresConfirmation: false });
          }
        } catch (err: any) {
          store.updateTimelineStep(stepId, 'failed', err.message);
          resolve({ success: false, requiresConfirmation: false });
        }
      },
      onCancel: () => {
        store.setConfirmationCard(null);
        resolve({ success: false, requiresConfirmation: false });
      },
    });
  });
}

export async function commandReplyEmail(params: { messageId?: string; body: string }) {
  const store = useMailStore.getState();

  // Context-aware message lookup: use params.messageId or active open email
  const targetId = params.messageId || store.selectedEmailId;
  const targetEmail = store.emails.find((e) => e.id === targetId || e.gmailMessageId === targetId);

  if (!targetEmail) {
    return { success: false, error: 'No active email found to reply to' };
  }

  const replyTo = [targetEmail.senderEmail || targetEmail.sender];
  const replySubject = targetEmail.subject.startsWith('Re:')
    ? targetEmail.subject
    : `Re: ${targetEmail.subject}`;

  // Pre-fill compose drawer visibly
  store.openComposeModal();
  store.setComposeState({
    to: replyTo,
    subject: replySubject,
    body: params.body,
    replyToMessageId: targetEmail.id,
    threadId: targetEmail.threadId,
  });

  return new Promise<{ success: boolean; requiresConfirmation: boolean }>((resolve) => {
    store.setConfirmationCard({
      id: `conf_reply_${Date.now()}`,
      type: 'reply',
      title: 'Confirm Reply',
      summary: `Reply to ${targetEmail.senderName || targetEmail.sender} on "${targetEmail.subject}"?`,
      payload: {
        to: replyTo,
        subject: replySubject,
        body: params.body,
        messageId: targetEmail.id,
        threadId: targetEmail.threadId,
      },
      onConfirm: async () => {
        const stepId = store.addTimelineStep('Executing reply to email');
        try {
          const res = await fetch('/api/mail/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: replyTo,
              subject: replySubject,
              body: params.body,
              threadId: targetEmail.threadId,
            }),
          });

          if (res.ok) {
            store.closeComposeModal();
            store.setConfirmationCard(null);
            store.updateTimelineStep(stepId, 'completed', 'Reply sent successfully');
            resolve({ success: true, requiresConfirmation: false });
          } else {
            store.updateTimelineStep(stepId, 'failed', 'Reply failed');
            resolve({ success: false, requiresConfirmation: false });
          }
        } catch (err: any) {
          store.updateTimelineStep(stepId, 'failed', err.message);
          resolve({ success: false, requiresConfirmation: false });
        }
      },
      onCancel: () => {
        store.setConfirmationCard(null);
        resolve({ success: false, requiresConfirmation: false });
      },
    });
  });
}

export async function commandForwardEmail(params: { messageId?: string; to: string[] }) {
  const store = useMailStore.getState();
  const targetId = params.messageId || store.selectedEmailId;
  const targetEmail = store.emails.find((e) => e.id === targetId || e.gmailMessageId === targetId);

  if (!targetEmail) {
    return { success: false, error: 'No active email found to forward' };
  }

  const fwdSubject = targetEmail.subject.startsWith('Fwd:')
    ? targetEmail.subject
    : `Fwd: ${targetEmail.subject}`;
  const fwdBody = `\n\n---------- Forwarded message ---------\nFrom: ${targetEmail.sender}\nDate: ${targetEmail.receivedAt}\nSubject: ${targetEmail.subject}\nTo: ${targetEmail.recipient}\n\n${targetEmail.bodyText}`;

  store.openComposeModal();
  store.setComposeState({
    to: params.to,
    subject: fwdSubject,
    body: fwdBody,
  });

  return { success: true };
}
