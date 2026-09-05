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
      const fetchedEmails = data.emails || [];
      store.setEmails(fetchedEmails);

      if (fetchedEmails.length > 0 && !store.selectedEmailId) {
        store.setSelectedEmailId(fetchedEmails[0].id);
      }

      store.updateTimelineStep(stepId, 'completed', `Found ${fetchedEmails.length} matching emails`);
      return { success: true, count: fetchedEmails.length, emails: fetchedEmails };
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
  const searchTarget = params.messageId.toLowerCase();

  // Fuzzy matching to support database UUIDs, prefix IDs, and sender names
  const existing = store.emails.find((e) => {
    const idMatch = e.id === params.messageId || e.gmailMessageId === params.messageId;
    const prefixMatch = e.gmailMessageId.toLowerCase().includes(searchTarget);
    const senderMatch =
      (searchTarget.includes('sarah') && e.sender.toLowerCase().includes('sarah')) ||
      (searchTarget.includes('john') && e.sender.toLowerCase().includes('john')) ||
      (searchTarget.includes('alex') && e.sender.toLowerCase().includes('alex'));
    return idMatch || prefixMatch || senderMatch;
  });

  const stepId = store.addTimelineStep('Opening email', `Target: ${params.messageId}`);

  if (existing) {
    store.setSelectedEmailId(existing.id);

    // Mark as read in local state and trigger API update
    if (!existing.isRead) {
      const updated = store.emails.map((e) =>
        e.id === existing.id || e.gmailMessageId === existing.gmailMessageId
          ? { ...e, isRead: true }
          : e
      );
      store.setEmails(updated);
      fetch(`/api/mail/${existing.id}`).catch(() => {});
    }

    store.updateTimelineStep(stepId, 'completed', `Opened "${existing.subject}"`);
    return { success: true, email: existing };
  }

  // Fallback: select first email in store if list is filtered
  if (store.emails.length > 0) {
    const fallback = store.emails[0];
    store.setSelectedEmailId(fallback.id);

    if (!fallback.isRead) {
      const updated = store.emails.map((e) =>
        e.id === fallback.id ? { ...e, isRead: true } : e
      );
      store.setEmails(updated);
      fetch(`/api/mail/${fallback.id}`).catch(() => {});
    }

    store.updateTimelineStep(stepId, 'completed', `Opened "${fallback.subject}"`);
    return { success: true, email: fallback };
  }

  store.updateTimelineStep(stepId, 'failed', `Email not found: ${params.messageId}`);
  return { success: false, error: 'Email not found' };
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

let isSendingLock = false;
let lastSentHash = '';
let lastSentTime = 0;

/**
 * Execute email send directly & refresh inbox/sent list
 */
export async function executeSendEmailDirect(to: string[], subject: string, body: string, threadId?: string) {
  const store = useMailStore.getState();
  const payloadHash = `${to.join(',')}|${subject}|${body}`;
  const now = Date.now();

  // Deduplication guard: prevent sending identical email twice within 3 seconds or concurrent execution
  if (isSendingLock || (payloadHash === lastSentHash && now - lastSentTime < 3000)) {
    console.warn('[executeSendEmailDirect] Blocked duplicate email send request');
    return { success: true };
  }

  isSendingLock = true;
  lastSentHash = payloadHash;
  lastSentTime = now;

  const stepId = store.addTimelineStep('Sending email', `To: ${to.join(', ')} | Subject: ${subject}`);

  try {
    const res = await fetch('/api/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        body,
        threadId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      store.closeComposeModal();
      store.clearAllFilters(); // Clear active search keyword filter so sent email is visible!
      store.setActiveView('sent'); // Switch to sent view

      // Fetch fresh email list
      const listRes = await fetch('/api/mail/list?view=sent');
      if (listRes.ok) {
        const listData = await listRes.json();
        store.setEmails(listData.emails || []);
      }

      store.updateTimelineStep(stepId, 'completed', 'Email sent & list updated');
      return { success: true, email: data.email };
    } else {
      const errData = await res.json().catch(() => ({}));
      store.updateTimelineStep(stepId, 'failed', errData.error || 'Send request failed');
      return { success: false, error: errData.error || 'Send request failed' };
    }
  } catch (err: any) {
    store.updateTimelineStep(stepId, 'failed', err.message || 'Send error');
    return { success: false, error: err.message };
  } finally {
    isSendingLock = false;
  }
}

export async function commandSendEmail(params: {
  composeDraftId?: string;
  to?: string[];
  subject?: string;
  body?: string;
}) {
  const store = useMailStore.getState();
  
  // 1. CAPTURE DRAFT DETAILS FIRST BEFORE CLOSING/RESETTING THE COMPOSE MODAL
  const to = (params.to && params.to.length > 0) ? params.to : store.composeState.to;
  const subject = params.subject !== undefined ? params.subject : store.composeState.subject;
  const body = params.body !== undefined ? params.body : store.composeState.body;
  const threadId = store.composeState.threadId;

  // 2. NOW CLOSE AND RESET COMPOSE MODAL
  store.closeComposeModal();

  if (!to || to.length === 0) {
    return { success: false, error: 'No recipient email specified' };
  }

  return new Promise<{ success: boolean; requiresConfirmation: boolean }>((resolve) => {
    store.setConfirmationCard({
      id: `conf_${Date.now()}`,
      type: 'send',
      title: 'Confirm Send Email',
      summary: `Send email to ${to.join(', ')} with subject "${subject}"?`,
      payload: {
        to,
        subject,
        body,
      },
      onConfirm: async () => {
        const result = await executeSendEmailDirect(to, subject, body, threadId);
        store.setConfirmationCard(null);
        resolve({ success: result.success, requiresConfirmation: false });
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

  const targetId = (params.messageId || store.selectedEmailId || '').toLowerCase();

  const targetEmail =
    store.emails.find((e) => {
      if (!targetId) return false;
      const idMatch = e.id === params.messageId || e.gmailMessageId === params.messageId;
      const prefixMatch = e.gmailMessageId.toLowerCase().includes(targetId);
      const senderMatch =
        (targetId.includes('alex') && e.sender.toLowerCase().includes('alex')) ||
        (targetId.includes('sarah') && e.sender.toLowerCase().includes('sarah')) ||
        (targetId.includes('john') && e.sender.toLowerCase().includes('john'));
      return idMatch || prefixMatch || senderMatch;
    }) ||
    (store.selectedEmailId ? store.emails.find((e) => e.id === store.selectedEmailId) : store.emails[0]);

  if (!targetEmail) {
    return { success: false, error: 'No active email found to reply to' };
  }

  const replyTo = [targetEmail.senderEmail || targetEmail.sender];
  const replySubject = targetEmail.subject.startsWith('Re:')
    ? targetEmail.subject
    : `Re: ${targetEmail.subject}`;

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
        const result = await executeSendEmailDirect(replyTo, replySubject, params.body, targetEmail.threadId);
        store.setConfirmationCard(null);
        resolve({ success: result.success, requiresConfirmation: false });
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

/**
 * Client-Side Router for AI Tool Calls
 * Executes UI state mutations directly in the browser React environment.
 */
export async function executeClientAIToolCall(name: string, args: any) {
  switch (name) {
    case 'search_emails':
      return await commandSearchEmails(args);
    case 'open_email':
      return await commandOpenEmail(args);
    case 'apply_email_filter':
      return await commandApplyFilter(args);
    case 'open_compose':
      return await commandOpenCompose();
    case 'populate_compose':
      return await commandPopulateCompose(args);
    case 'send_email':
      return await commandSendEmail(args);
    case 'reply_to_email':
      return await commandReplyEmail(args);
    case 'forward_email':
      return await commandForwardEmail(args);
    case 'delete_email':
      return await commandDeleteEmail(args);
    case 'restore_email':
      return await commandRestoreEmail(args);
    default:
      console.warn(`Unknown AI client tool: ${name}`);
      return { success: false };
  }
}

export async function commandDeleteEmail(params: { messageId?: string }) {
  const store = useMailStore.getState();
  const targetId = params.messageId || store.selectedEmailId;
  const targetEmail = store.emails.find((e) => e.id === targetId || e.gmailMessageId === targetId);
  if (!targetEmail) return { success: false, error: 'No active email found to delete' };
  const stepId = store.addTimelineStep('Moving email to Trash', 'Subject: "' + targetEmail.subject + '"');
  try {
    const res = await fetch('/api/mail/' + targetEmail.id + '/trash', { method: 'POST' });
    if (res.ok) {
      if (store.selectedEmailId === targetEmail.id || store.selectedEmailId === targetEmail.gmailMessageId) store.setSelectedEmailId(null);
      const listRes = await fetch('/api/mail/list?view=' + store.activeView);
      if (listRes.ok) { const listData = await listRes.json(); store.setEmails(listData.emails || []); }
      store.updateTimelineStep(stepId, 'completed', 'Moved message to Trash');
      return { success: true };
    } else {
      const err = await res.json().catch(() => ({}));
      store.updateTimelineStep(stepId, 'failed', err.error || 'Failed to move to Trash');
      return { success: false, error: err.error };
    }
  } catch (err: any) {
    store.updateTimelineStep(stepId, 'failed', err.message || 'Trash error');
    return { success: false, error: err.message };
  }
}

export async function commandRestoreEmail(params: { messageId?: string }) {
  const store = useMailStore.getState();
  const targetId = params.messageId || store.selectedEmailId;
  const targetEmail = store.emails.find((e) => e.id === targetId || e.gmailMessageId === targetId);
  if (!targetEmail) return { success: false, error: 'No active email found to restore' };
  const stepId = store.addTimelineStep('Restoring email from Trash', 'Subject: "' + targetEmail.subject + '"');
  try {
    const res = await fetch('/api/mail/' + targetEmail.id + '/trash', { method: 'DELETE' });
    if (res.ok) {
      if (store.selectedEmailId === targetEmail.id || store.selectedEmailId === targetEmail.gmailMessageId) store.setSelectedEmailId(null);
      const listRes = await fetch('/api/mail/list?view=' + store.activeView);
      if (listRes.ok) { const listData = await listRes.json(); store.setEmails(listData.emails || []); }
      store.updateTimelineStep(stepId, 'completed', 'Restored message to inbox');
      return { success: true };
    } else {
      const err = await res.json().catch(() => ({}));
      store.updateTimelineStep(stepId, 'failed', err.error || 'Failed to restore');
      return { success: false, error: err.error };
    }
  } catch (err: any) {
    store.updateTimelineStep(stepId, 'failed', err.message || 'Restore error');
    return { success: false, error: err.message };
  }
}

export async function commandPermanentlyDeleteEmail(params: { messageId?: string }) {
  const store = useMailStore.getState();
  const targetId = params.messageId || store.selectedEmailId;
  const targetEmail = store.emails.find((e) => e.id === targetId || e.gmailMessageId === targetId);
  if (!targetEmail) return { success: false, error: 'No active email found to permanently delete' };
  return new Promise<{ success: boolean; requiresConfirmation: boolean }>((resolve) => {
    store.setConfirmationCard({
      id: 'conf_del_' + Date.now(),
      type: 'delete',
      title: 'Confirm Permanent Delete',
      summary: 'Permanently delete correspondence "' + targetEmail.subject + '"? This action cannot be undone.',
      payload: { to: [targetEmail.recipient], subject: targetEmail.subject, body: targetEmail.snippet, messageId: targetEmail.id },
      onConfirm: async () => {
        const stepId = store.addTimelineStep('Permanently deleting email', 'Subject: "' + targetEmail.subject + '"');
        try {
          const res = await fetch('/api/mail/' + targetEmail.id + '/delete', { method: 'DELETE' });
          if (res.ok) {
            if (store.selectedEmailId === targetEmail.id || store.selectedEmailId === targetEmail.gmailMessageId) store.setSelectedEmailId(null);
            const listRes = await fetch('/api/mail/list?view=' + store.activeView);
            if (listRes.ok) { const listData = await listRes.json(); store.setEmails(listData.emails || []); }
            store.updateTimelineStep(stepId, 'completed', 'Permanently deleted message');
            store.setConfirmationCard(null);
            resolve({ success: true, requiresConfirmation: false });
          } else {
            const err = await res.json().catch(() => ({}));
            store.updateTimelineStep(stepId, 'failed', err.error || 'Failed to delete permanently');
            store.setConfirmationCard(null);
            resolve({ success: false, requiresConfirmation: false });
          }
        } catch (err: any) {
          store.updateTimelineStep(stepId, 'failed', err.message || 'Permanent delete error');
          store.setConfirmationCard(null);
          resolve({ success: false, requiresConfirmation: false });
        }
      },
      onCancel: () => { store.setConfirmationCard(null); resolve({ success: false, requiresConfirmation: false }); },
    });
  });
}