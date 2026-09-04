import { describe, it, expect } from 'vitest';
import {
  SearchEmailsArgs,
  OpenEmailArgs,
  ApplyEmailFilterArgs,
  PopulateComposeArgs,
  SendEmailArgs,
  ReplyToEmailArgs,
} from '@/lib/ai/schemas';

describe('AI Tool Zod Schemas Validation', () => {
  it('validates search_emails schema arguments', () => {
    const valid = SearchEmailsArgs.parse({
      from: 'Sarah',
      keyword: 'project update',
      isUnread: true,
      after: '2026-08-01',
    });
    expect(valid.from).toBe('Sarah');
    expect(valid.isUnread).toBe(true);
  });

  it('validates open_email schema arguments', () => {
    const valid = OpenEmailArgs.parse({ messageId: 'msg_12345' });
    expect(valid.messageId).toBe('msg_12345');
  });

  it('validates apply_email_filter schema arguments', () => {
    const valid = ApplyEmailFilterArgs.parse({
      isUnread: true,
      startDate: '2026-08-25',
    });
    expect(valid.isUnread).toBe(true);
    expect(valid.startDate).toBe('2026-08-25');
  });

  it('validates populate_compose schema arguments', () => {
    const valid = PopulateComposeArgs.parse({
      to: ['john@example.com'],
      subject: 'Meeting Tomorrow',
      body: "Let's meet at 3pm.",
    });
    expect(valid.to).toContain('john@example.com');
    expect(valid.subject).toBe('Meeting Tomorrow');
  });

  it('validates reply_to_email schema arguments', () => {
    const valid = ReplyToEmailArgs.parse({
      body: "I'll handle it tomorrow.",
    });
    expect(valid.body).toBe("I'll handle it tomorrow.");
  });
});
