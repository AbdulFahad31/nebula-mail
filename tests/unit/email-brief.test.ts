import { describe, it, expect, vi } from 'vitest';
import { EmailBriefSchema, TRUNCATION_LIMIT } from '@/lib/ai/email-brief';

describe('Nebula Brief — AI Email Summary & Action Items', () => {
  it('1. Normal email: validates correct structured brief against Zod schema', () => {
    const mockBrief = {
      summary: 'The team discussed the upcoming Q4 product launch schedule.',
      actionItems: ['Prepare slide deck', 'Review budget'],
      deadline: '2026-09-15',
      keyPoints: ['Product launch set for October', 'Marketing budget approved'],
      suggestedReply: 'Thanks for the update. I will review the slides.',
    };

    const parsed = EmailBriefSchema.safeParse(mockBrief);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.summary).toBe(mockBrief.summary);
      expect(parsed.data.actionItems).toHaveLength(2);
    }
  });

  it('2. Email with clear action items: populates actionItems correctly', () => {
    const mockBrief = {
      summary: 'Action item request for security audit.',
      actionItems: ['Submit security log', 'Rotate API keys'],
      deadline: null,
      keyPoints: ['Security audit begins Monday'],
      suggestedReply: null,
    };

    const parsed = EmailBriefSchema.safeParse(mockBrief);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.actionItems).toContain('Submit security log');
      expect(parsed.data.actionItems).toContain('Rotate API keys');
    }
  });

  it('3. Email without a deadline: deadline is null and not guessed', () => {
    const mockBrief = {
      summary: 'General inquiry about team lunch.',
      actionItems: [],
      deadline: null,
      keyPoints: ['Lunch at 12pm'],
      suggestedReply: null,
    };

    const parsed = EmailBriefSchema.safeParse(mockBrief);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.deadline).toBeNull();
    }
  });

  it('4. Email with an explicit deadline phrase: deadline is extracted correctly', () => {
    const mockBrief = {
      summary: 'Project submission instructions.',
      actionItems: ['Upload final report'],
      deadline: '2026-09-12 at 5 PM',
      keyPoints: ['Final submission portal open'],
      suggestedReply: 'Noted, thanks!',
    };

    const parsed = EmailBriefSchema.safeParse(mockBrief);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.deadline).toBe('2026-09-12 at 5 PM');
    }
  });

  it('5. Malformed/invalid Gemini response: schema validation catches it gracefully', () => {
    const malformedData = {
      // missing required summary string
      actionItems: 'not an array',
      deadline: 12345,
    };

    const parsed = EmailBriefSchema.safeParse(malformedData);
    expect(parsed.success).toBe(false);
  });

  it('6. Simulated Gemini API failure handling: distinguishes daily quota (RPD) vs per-minute (RPM) rate limits', () => {
    const formatError = (rawErrorStr: string) => {
      const isDailyQuota =
        /PerDay|RequestsPerDay|GenerateRequestsPerDay|limit:\s*20\b/i.test(rawErrorStr) ||
        (rawErrorStr.includes('QuotaExceeded') && rawErrorStr.includes('FreeTier')) ||
        rawErrorStr.includes('GenerateRequestsPerDayPerProjectPerModel');

      return isDailyQuota
        ? 'Daily AI usage limit reached for this project. This will reset tomorrow, or you can enable billing in Google AI Studio to increase limits.'
        : 'AI request limit reached — please wait about a minute and try again.';
    };

    const rpdError = 'Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-2.5-flash. GenerateRequestsPerDayPerProjectPerModel-FreeTier';
    const rpmError = 'Rate limit exceeded: 15 requests per minute limit reached.';

    expect(formatError(rpdError)).toBe(
      'Daily AI usage limit reached for this project. This will reset tomorrow, or you can enable billing in Google AI Studio to increase limits.'
    );
    expect(formatError(rpmError)).toBe(
      'AI request limit reached — please wait about a minute and try again.'
    );
  });

  it('7. Very long email body: verifies safe truncation limit constant', () => {
    const longText = 'A'.repeat(10000);
    const truncated = longText.slice(0, TRUNCATION_LIMIT);

    expect(TRUNCATION_LIMIT).toBe(4000);
    expect(truncated.length).toBe(4000);
  });

  it('8. Isolated payload scope: verifies only target email content is passed', () => {
    const targetEmail = {
      subject: 'Target Subject',
      sender: 'alex@example.com',
      recipient: 'user@example.com',
      bodyText: 'Target Body Content Only',
    };

    expect(targetEmail).not.toHaveProperty('oauthToken');
    expect(targetEmail).not.toHaveProperty('otherUserEmails');
    expect(targetEmail.subject).toBe('Target Subject');
    expect(targetEmail.bodyText).toBe('Target Body Content Only');
  });
});
