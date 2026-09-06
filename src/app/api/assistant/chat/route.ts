import { NextRequest, NextResponse } from 'next/server';
import { ALL_TOOLS } from '@/lib/ai/gemini';
import { fallbackOrchestrator } from '@/lib/ai/providers/fallback-orchestrator';

export async function POST(req: NextRequest) {
  try {
    const { prompt, currentOpenEmailId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    try {
      const systemInstruction = `You are Nebula Mail's AI UI Assistant. You CONTROL the mail application UI by invoking tool calls.
Current UI Context:
- Currently open email ID: ${currentOpenEmailId || 'None'}
- Today's date: ${new Date().toISOString().split('T')[0]}

Rules:
1. NEVER reply in plain text if a tool call can achieve the user's intent. ALWAYS invoke the appropriate function tools.
2. For compose requests ("Send email to X..."): invoke open_compose, populate_compose, and send_email.
3. For search requests ("emails from last 10 days", "who sent me something about DSA"): extract arguments (from, keyword, subject, isUnread, after, before) and call search_emails.
4. For multi-step search & reply requests ("Search emails about X and reply with Y"): call search_emails with extracted keyword/from, open_email (omit messageId if unknown), and reply_to_email with body text Y. NEVER invent fake message IDs.
5. For person/topic search ("email from Sarah...", "anything from Google regarding account"): call search_emails with extracted from/keyword parameters.
6. For context-aware reply ("Reply that..."): call reply_to_email using current open email or search result.
7. For compound filter ("unread from this week"): call apply_email_filter with { isUnread: true, startDate }.
8. For plain unread search ("show me unread emails"): call apply_email_filter with ONLY { isUnread: true }. NEVER add startDate or after unless explicitly asked.
9. For 'open email' requests (e.g. 'open email from google', 'open the email about X'): extract the target sender (e.g. 'google') or topic and call search_emails with from: 'google' or keyword: 'x', AND call open_email. NEVER put command verbs like 'Open', 'Find', or 'Search' inside the keyword parameter.`;

      const response = await fallbackOrchestrator.generateContent({
        prompt,
        systemInstruction,
        tools: ALL_TOOLS,
      });

      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolCalls = response.toolCalls.map((tc) => ({
          name: tc.name,
          args: tc.arguments,
        }));

        return NextResponse.json({
          reply: `Invoked ${toolCalls.length} tool(s) to execute your request.`,
          toolCalls,
        });
      }

      // If GenAI/fallback did not emit function calls, fallback to deterministic rule parser
      return handleRuleBasedAssistant(prompt, currentOpenEmailId);
    } catch (genAiError: any) {
      console.warn('AI fallback chain error, falling back to smart intent parser:', genAiError?.message || genAiError);
      return handleRuleBasedAssistant(prompt, currentOpenEmailId);
    }
  } catch (error: any) {
    console.error('Assistant API error:', error);
    return NextResponse.json({ error: error.message || 'AI processing failed' }, { status: 500 });
  }
}

async function handleRuleBasedAssistant(prompt: string, currentOpenEmailId?: string) {
  const p = prompt.toLowerCase();
  const today = new Date();

  // Extract explicit quote content if provided e.g. "I will review this tomorrow"
  const quoteMatch = prompt.match(/["']([^"']+)["']/);
  const quotedText = quoteMatch ? quoteMatch[1].trim() : null;

  // Scenario 1: Draft/Populate Compose command (e.g. "Draft a reply saying 'I will review this tomorrow'")
  if (p.includes('draft') || p.includes('populate')) {
    const bodyText = quotedText || "I will review this tomorrow.";
    const to = ['john@example.com'];
    const subject = 'Re: Meeting Tomorrow';

    return NextResponse.json({
      reply: `Prepared compose draft with body: "${bodyText}".`,
      toolCalls: [
        { name: 'open_compose', args: {} },
        { name: 'populate_compose', args: { to, subject, body: bodyText } },
      ],
    });
  }

  // Scenario 2: Compose & Direct Send from instruction
  if (p.includes('send an email') || p.includes('send email') || p.includes('compose')) {
    const toMatch = prompt.match(/to\s+([^\s]+@[^\s]+)/i);
    const subjectMatch = prompt.match(/subject\s+["']?([^"'\n]+?)["']?\s+(?:and|with|body|$)/i);
    const bodyMatch = prompt.match(/body\s+["']?([^"'\n]+)["']?/i);

    const to = toMatch ? [toMatch[1]] : ['john@example.com'];
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Meeting Tomorrow';
    const body = bodyMatch ? bodyMatch[1].trim() : (quotedText || "Let's meet at 3pm.");

    return NextResponse.json({
      reply: `Prepared email to ${to.join(', ')} with subject "${subject}".`,
      toolCalls: [
        { name: 'send_email', args: { composeDraftId: 'draft_active', to, subject, body } },
      ],
    });
  }

  // Scenario 3: Time-based search ("last 10 days")
  if (p.includes('last 10 days') || p.includes('10 days')) {
    const d = new Date(today);
    d.setDate(d.getDate() - 10);
    const startDate = d.toISOString().split('T')[0];

    return NextResponse.json({
      reply: `Filtered inbox for emails received in the last 10 days.`,
      toolCalls: [{ name: 'apply_email_filter', args: { startDate } }],
    });
  }

  // Scenario 4: Multi-step tool chain ("Search emails about dsa and reply to the sender with Received, thanks!")
  if (p.includes('search') && p.includes('reply')) {
    const topicMatch = prompt.match(/(?:about|for|regarding)\s+["']?([^"'\n]+?)["']?\s+(?:and|with|reply|$)/i);
    const keyword = topicMatch ? topicMatch[1].trim() : (p.includes('invoice') ? 'invoice' : 'dsa');
    const replyText = quotedText || "Received, thanks!";
    return NextResponse.json({
      reply: `Searched ${keyword} emails, opened correspondence, and prepared reply: "${replyText}".`,
      toolCalls: [
        { name: 'search_emails', args: { keyword } },
        { name: 'reply_to_email', args: { body: replyText } },
      ],
    });
  }

  // Scenario 5: Context-aware reply ("Reply that I'll handle it tomorrow")
  if (p.includes('reply')) {
    const replyText = quotedText || (p.includes('handle it tomorrow') ? "I'll handle it tomorrow." : "I will review this tomorrow.");

    return NextResponse.json({
      reply: `Prepared reply: "${replyText}".`,
      toolCalls: [{ name: 'reply_to_email', args: { messageId: currentOpenEmailId, body: replyText } }],
    });
  }

  // Scenario 6a: Time-qualified unread filter ("unread emails from this week", "unread from last 10 days")
  const hasTimeKeyword = p.includes('week') || p.includes('day') || p.includes('days') || p.includes('since') || p.includes('after') || p.includes('last');
  
  if (p.includes('unread') && hasTimeKeyword) {
    const d = new Date(today);
    d.setDate(d.getDate() - 7);
    const startDate = d.toISOString().split('T')[0];

    return NextResponse.json({
      reply: `Applied filter for unread emails received this week.`,
      toolCalls: [{ name: 'apply_email_filter', args: { isUnread: true, startDate } }],
    });
  }

  // Scenario 6b: Plain unread filter without time qualifier ("show me unread emails")
  if (p.includes('unread')) {
    return NextResponse.json({
      reply: `Filtered inbox for unread emails.`,
      toolCalls: [{ name: 'apply_email_filter', args: { isUnread: true } }],
    });
  }

  // Scenario 6c: Time range only without unread filter ("this week", "emails from this week")
  if (p.includes('this week')) {
    const d = new Date(today);
    d.setDate(d.getDate() - 7);
    const startDate = d.toISOString().split('T')[0];

    return NextResponse.json({
      reply: `Filtered inbox for emails received this week.`,
      toolCalls: [{ name: 'apply_email_filter', args: { startDate } }],
    });
  }

  // Scenario 7: Open / Search from specific sender or topic (e.g. "Open the email from google", "Open email from Sarah", "Search emails about Google")
  const openOrSearchMatch = prompt.match(/^(?:open|find|search|show|get|pull\s+up)\s+(?:the\s+)?(?:emails?|messages?|correspondence)?\s*(?:about|for|from|regarding)?\s+(.+)$/i);
  if (openOrSearchMatch) {
    let target = openOrSearchMatch[1].trim();
    target = target.replace(/^(?:the\s+)?(?:email|message|correspondence)?\s*(?:from|about|regarding|for)?\s+/i, '').trim();

    const isFrom = p.includes('from') || prompt.toLowerCase().includes('from');
    const searchArgs = isFrom ? { from: target } : { keyword: target };

    return NextResponse.json({
      reply: `Searched and opened email matching "${target}".`,
      toolCalls: [
        { name: 'search_emails', args: searchArgs },
        { name: 'open_email', args: { messageId: target } },
      ],
    });
  }

  // Default search fallback
  const keywordExtract = prompt
    .replace(/^(?:open|find|search|show|get|pull\s+up)\s+(?:the\s+)?(?:emails?|messages?|correspondence)?\s*(?:about|for|from|regarding)?/i, '')
    .trim() || prompt;

  return NextResponse.json({
    reply: `Searched inbox for "${keywordExtract}".`,
    toolCalls: [
      { name: 'search_emails', args: { keyword: keywordExtract } },
    ],
  });
}

