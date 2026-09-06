import { z } from 'zod';
import { fallbackOrchestrator } from './providers/fallback-orchestrator';

export const EmailBriefSchema = z.object({
  summary: z.string().describe('A concise 1-2 sentence overview of the email content'),
  actionItems: z.array(z.string()).default([]).describe('Action items requested or required in the email. Empty array if none.'),
  deadline: z.string().nullable().default(null).describe('Explicitly stated deadline or date due mentioned in the email text, or null if none is mentioned.'),
  keyPoints: z.array(z.string()).default([]).describe('Key takeaway points or bullet points summarized from the email.'),
  suggestedReply: z.string().nullable().default(null).describe('A polite, brief suggested reply draft if appropriate, or null.'),
});

export type EmailBrief = z.infer<typeof EmailBriefSchema>;

/**
 * Truncation limit constant: 4000 characters (~1000 tokens).
 * Ensures safe token budget to prevent API timeouts or payload bloat on very long emails.
 */
export const TRUNCATION_LIMIT = 4000;

export function generateLocalExtractiveBrief(emailData: {
  subject: string;
  sender: string;
  recipient: string;
  bodyText: string;
  bodyHtml?: string;
}): EmailBrief {
  const cleanBody = (emailData.bodyText || emailData.bodyHtml || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = cleanBody
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const firstSentences = sentences.slice(0, 2).join(' ');
  const summary = firstSentences
    ? (emailData.subject && !firstSentences.toLowerCase().includes(emailData.subject.toLowerCase())
        ? `${emailData.subject}: ${firstSentences}`
        : firstSentences)
    : emailData.subject || 'Email correspondence overview.';

  const actionKeywords = /\b(please|kindly|make sure|need to|verify|ensure|complete|submit|review|action|due)\b/i;
  const actionItems: string[] = [];
  for (const s of sentences) {
    if (actionKeywords.test(s) && s.length < 180) {
      const cleanedAction = s.replace(/^(hi|hello|dear|thanks|thank you)\s*[^,]*,?\s*/i, '').trim();
      if (cleanedAction && !actionItems.includes(cleanedAction)) {
        actionItems.push(cleanedAction);
      }
      if (actionItems.length >= 4) break;
    }
  }

  const deadlineMatch =
    cleanBody.match(/\b(by\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|tonight|[a-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2}))\b/i) ||
    cleanBody.match(/\b(due\s+(?:on\s+)?(?:[a-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2}|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i);
  const deadline = deadlineMatch ? deadlineMatch[1] : null;

  const keyPoints: string[] = [];
  for (let i = 0; i < Math.min(sentences.length, 3); i++) {
    if (sentences[i] && !actionItems.includes(sentences[i])) {
      keyPoints.push(sentences[i]);
    }
  }
  if (keyPoints.length === 0 && sentences.length > 0) {
    keyPoints.push(sentences[0]);
  }

  const senderName = emailData.sender ? emailData.sender.split('<')[0].trim() : 'there';
  const suggestedReply = `Hi ${senderName}, thanks for the update regarding "${emailData.subject || 'this matter'}". I have reviewed the details and will follow up accordingly.`;

  return {
    summary,
    actionItems,
    deadline,
    keyPoints,
    suggestedReply,
  };
}

export async function generateEmailBrief(emailData: {
  subject: string;
  sender: string;
  recipient: string;
  bodyText: string;
  bodyHtml?: string;
}): Promise<EmailBrief> {
  // Extract plain text & strip HTML tags, script, style, and markup noise
  let rawBody = emailData.bodyText || '';
  if (!rawBody && emailData.bodyHtml) {
    rawBody = emailData.bodyHtml;
  }

  const cleanBody = rawBody
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Safe truncation limit
  const truncatedBody = cleanBody.slice(0, TRUNCATION_LIMIT);

  const prompt = `Subject: ${emailData.subject}
From: ${emailData.sender}
To: ${emailData.recipient}

Email Body:
${truncatedBody}`;

  const systemInstruction = `You are Nebula Mail's AI Brief Generator. Analyze the provided email and output a strict JSON object matching this structure:
{
  "summary": "1-2 sentence overview of the email",
  "actionItems": ["action item 1", "action item 2"],
  "deadline": "YYYY-MM-DD or specific deadline string if explicitly mentioned, otherwise null",
  "keyPoints": ["point 1", "point 2"],
  "suggestedReply": "polite draft reply string if appropriate, otherwise null"
}

STRICT GROUNDING RULES:
1. ONLY include actionItems that are explicitly requested or required in the email text. If no action items exist, return an empty array []. Never invent action items.
2. ONLY include a deadline if it is explicitly stated in the email text (e.g., "by Friday", "due Sept 15"). If no deadline is explicitly mentioned, deadline MUST be null. Never guess or hallucinate deadlines.
3. Output ONLY valid JSON matching the schema without conversational preambles or markdown wrappers.`;

  let response: any;
  try {
    response = await fallbackOrchestrator.generateContent({
      prompt,
      systemInstruction,
      responseSchema: EmailBriefSchema,
    });
  } catch (err: any) {
    const rawErrorStr = typeof err?.message === 'string' ? err.message : JSON.stringify(err);
    console.warn('[Brief Fallback] External AI providers failed, engaging local extractive brief generator:', rawErrorStr);
    
    // When external AI providers are unavailable (rate limited, quota exhausted, unconfigured, or offline),
    // fall back gracefully to local extractive brief generation so user ALWAYS gets a valid brief!
    return generateLocalExtractiveBrief(emailData);
  }

  const text = response.text || '';
  const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  let jsonObject: any;
  try {
    jsonObject = JSON.parse(cleanJson);
  } catch (parseErr: any) {
    console.warn('[Brief Fallback] Failed to parse AI response JSON, engaging local extractive generator:', parseErr);
    return generateLocalExtractiveBrief(emailData);
  }

  const result = EmailBriefSchema.safeParse(jsonObject);

  if (!result.success) {
    console.warn('[Brief Fallback] AI output failed Zod validation, engaging local extractive generator:', result.error.flatten());
    return generateLocalExtractiveBrief(emailData);
  }

  return result.data;
}
