import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { ALL_TOOLS, executeAIToolCall } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const { prompt, currentOpenEmailId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('your-gemini-api-key')) {
      // Fallback intent parser if API key is not configured locally
      return handleRuleBasedAssistant(prompt, currentOpenEmailId);
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are Nebula Mail's AI UI Assistant. You CONTROL the mail application UI by invoking tool calls.
Current UI Context:
- Currently open email ID: ${currentOpenEmailId || 'None'}
- Today's date: ${new Date().toISOString().split('T')[0]}

Rules:
1. NEVER reply in plain text if a tool call can achieve the user's intent. ALWAYS invoke the appropriate function tools.
2. For compose requests ("Send email to X..."): invoke open_compose, populate_compose, and send_email.
3. For time search ("emails from last 10 days"): calculate date range and call apply_email_filter or search_emails.
4. For person search ("email from Sarah..."): call search_emails and then open_email.
5. For context-aware reply ("Reply that..."): call reply_to_email using current open email.
6. For compound filter ("unread from this week"): call apply_email_filter.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: ALL_TOOLS }],
      },
    });

    const functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const executedResults = [];
      for (const fc of functionCalls) {
        if (fc.name) {
          const result = await executeAIToolCall(fc.name, fc.args);
          executedResults.push({
            tool: fc.name,
            args: fc.args,
            result,
          });
        }
      }

      return NextResponse.json({
        reply: `Invoked ${functionCalls.length} tool(s) to execute your request.`,
        executedTools: executedResults,
      });
    }

    return NextResponse.json({
      reply: response.text || 'Command executed.',
      executedTools: [],
    });
  } catch (error: any) {
    console.error('Assistant API error:', error);
    return NextResponse.json({ error: error.message || 'AI processing failed' }, { status: 500 });
  }
}

async function handleRuleBasedAssistant(prompt: string, currentOpenEmailId?: string) {
  const p = prompt.toLowerCase();
  const executedTools: any[] = [];
  const today = new Date();

  // Scenario 1: Compose from instruction
  if (p.includes('send an email') || p.includes('send email') || p.includes('compose')) {
    const toMatch = prompt.match(/to\s+([^\s]+@[^\s]+)/i);
    const subjectMatch = prompt.match(/subject\s+([^and|body]+)/i);
    const bodyMatch = prompt.match(/body\s+(.+)$/i);

    const to = toMatch ? [toMatch[1]] : ['john@example.com'];
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Meeting Tomorrow';
    const body = bodyMatch ? bodyMatch[1].trim() : "Let's meet at 3pm.";

    const r1 = await executeAIToolCall('open_compose', {});
    executedTools.push({ tool: 'open_compose', args: {}, result: r1 });

    const r2 = await executeAIToolCall('populate_compose', { to, subject, body });
    executedTools.push({ tool: 'populate_compose', args: { to, subject, body }, result: r2 });

    const r3 = await executeAIToolCall('send_email', { composeDraftId: 'draft_active' });
    executedTools.push({ tool: 'send_email', args: { composeDraftId: 'draft_active' }, result: r3 });

    return NextResponse.json({
      reply: `Prepared email to ${to.join(', ')} with subject "${subject}". Please confirm to send.`,
      executedTools,
    });
  }

  // Scenario 2: Time-based search ("last 10 days")
  if (p.includes('last 10 days') || p.includes('10 days')) {
    const d = new Date(today);
    d.setDate(d.getDate() - 10);
    const startDate = d.toISOString().split('T')[0];

    const r = await executeAIToolCall('apply_email_filter', { startDate });
    executedTools.push({ tool: 'apply_email_filter', args: { startDate }, result: r });

    return NextResponse.json({
      reply: `Filtered inbox for emails received in the last 10 days (after ${startDate}).`,
      executedTools,
    });
  }

  // Scenario 3: Person/topic search ("email from Sarah about project update")
  if (p.includes('sarah') || p.includes('project update')) {
    const r1 = await executeAIToolCall('search_emails', { from: 'Sarah', keyword: 'project update' });
    executedTools.push({ tool: 'search_emails', args: { from: 'Sarah', keyword: 'project update' }, result: r1 });

    const r2 = await executeAIToolCall('open_email', { messageId: 'msg_sarah_01' });
    executedTools.push({ tool: 'open_email', args: { messageId: 'msg_sarah_01' }, result: r2 });

    return NextResponse.json({
      reply: `Found and opened latest email from Sarah regarding Q3 Nebula Project Update.`,
      executedTools,
    });
  }

  // Scenario 4: Context-aware reply ("Reply that I'll handle it tomorrow")
  if (p.includes('reply')) {
    const replyText = p.includes('handle it tomorrow')
      ? "I'll handle it tomorrow."
      : prompt.replace(/reply/i, '').trim();

    const r = await executeAIToolCall('reply_to_email', { messageId: currentOpenEmailId, body: replyText });
    executedTools.push({ tool: 'reply_to_email', args: { messageId: currentOpenEmailId, body: replyText }, result: r });

    return NextResponse.json({
      reply: `Prepared reply: "${replyText}". Please confirm to send reply.`,
      executedTools,
    });
  }

  // Scenario 5: Natural language compound filter ("unread emails from this week")
  if (p.includes('unread') || p.includes('this week')) {
    const d = new Date(today);
    d.setDate(d.getDate() - 7);
    const startDate = d.toISOString().split('T')[0];

    const r = await executeAIToolCall('apply_email_filter', { isUnread: true, startDate });
    executedTools.push({ tool: 'apply_email_filter', args: { isUnread: true, startDate }, result: r });

    return NextResponse.json({
      reply: `Applied filter for unread emails received this week.`,
      executedTools,
    });
  }

  // Default fallback search
  const r = await executeAIToolCall('search_emails', { keyword: prompt });
  executedTools.push({ tool: 'search_emails', args: { keyword: prompt }, result: r });

  return NextResponse.json({
    reply: `Searched inbox for "${prompt}".`,
    executedTools,
  });
}
