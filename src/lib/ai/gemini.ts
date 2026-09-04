import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import {
  SearchEmailsArgs,
  OpenEmailArgs,
  ApplyEmailFilterArgs,
  OpenComposeArgs,
  PopulateComposeArgs,
  SendEmailArgs,
  ReplyToEmailArgs,
  ForwardEmailArgs,
} from './schemas';
import {
  commandSearchEmails,
  commandOpenEmail,
  commandApplyFilter,
  commandOpenCompose,
  commandPopulateCompose,
  commandSendEmail,
  commandReplyEmail,
  commandForwardEmail,
} from '@/lib/commands';

const searchEmailsTool: FunctionDeclaration = {
  name: 'search_emails',
  description: 'Search for emails by sender, recipient, subject, keyword, unread status, or date range.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      from: { type: Type.STRING, description: 'Sender name or email' },
      to: { type: Type.STRING, description: 'Recipient email' },
      subject: { type: Type.STRING, description: 'Subject line keyword' },
      keyword: { type: Type.STRING, description: 'General content keyword' },
      after: { type: Type.STRING, description: 'ISO date string or YYYY-MM-DD for emails after date' },
      before: { type: Type.STRING, description: 'ISO date string or YYYY-MM-DD for emails before date' },
      isUnread: { type: Type.BOOLEAN, description: 'Filter for unread emails only' },
    },
  },
};

const openEmailTool: FunctionDeclaration = {
  name: 'open_email',
  description: 'Open a specific email in detail view by its messageId.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      messageId: { type: Type.STRING, description: 'Message ID to open' },
    },
    required: ['messageId'],
  },
};

const applyEmailFilterTool: FunctionDeclaration = {
  name: 'apply_email_filter',
  description: 'Apply inbox filter chips (unread, sender, keyword, start date, end date).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      isUnread: { type: Type.BOOLEAN, description: 'Filter unread' },
      sender: { type: Type.STRING, description: 'Filter by sender' },
      keyword: { type: Type.STRING, description: 'Filter by keyword' },
      startDate: { type: Type.STRING, description: 'Start date YYYY-MM-DD' },
      endDate: { type: Type.STRING, description: 'End date YYYY-MM-DD' },
    },
  },
};

const openComposeTool: FunctionDeclaration = {
  name: 'open_compose',
  description: 'Open the email compose drawer.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const populateComposeTool: FunctionDeclaration = {
  name: 'populate_compose',
  description: 'Populate the compose email form with recipient array, subject, and body.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      to: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Recipient email addresses',
      },
      subject: { type: Type.STRING, description: 'Email subject line' },
      body: { type: Type.STRING, description: 'Email body text' },
    },
    required: ['to', 'subject', 'body'],
  },
};

const sendEmailTool: FunctionDeclaration = {
  name: 'send_email',
  description: 'Send the current compose draft email. Prompts explicit user confirmation card.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      composeDraftId: { type: Type.STRING, description: 'Current compose draft ID' },
    },
    required: ['composeDraftId'],
  },
};

const replyToEmailTool: FunctionDeclaration = {
  name: 'reply_to_email',
  description: 'Reply to an email or currently open email thread. Prompts user confirmation card.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      messageId: { type: Type.STRING, description: 'Optional target email ID (uses current email if omitted)' },
      body: { type: Type.STRING, description: 'Reply text content' },
    },
    required: ['body'],
  },
};

const forwardEmailTool: FunctionDeclaration = {
  name: 'forward_email',
  description: 'Forward an email or currently open email thread to recipient.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      messageId: { type: Type.STRING, description: 'Optional target email ID' },
      to: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Recipient emails',
      },
    },
    required: ['to'],
  },
};

export const ALL_TOOLS = [
  searchEmailsTool,
  openEmailTool,
  applyEmailFilterTool,
  openComposeTool,
  populateComposeTool,
  sendEmailTool,
  replyToEmailTool,
  forwardEmailTool,
];

export async function executeAIToolCall(name: string, rawArgs: any) {
  switch (name) {
    case 'search_emails': {
      const args = SearchEmailsArgs.parse(rawArgs);
      return await commandSearchEmails(args);
    }
    case 'open_email': {
      const args = OpenEmailArgs.parse(rawArgs);
      return await commandOpenEmail(args);
    }
    case 'apply_email_filter': {
      const args = ApplyEmailFilterArgs.parse(rawArgs);
      return await commandApplyFilter(args);
    }
    case 'open_compose': {
      OpenComposeArgs.parse(rawArgs);
      return await commandOpenCompose();
    }
    case 'populate_compose': {
      const args = PopulateComposeArgs.parse(rawArgs);
      return await commandPopulateCompose(args);
    }
    case 'send_email': {
      const args = SendEmailArgs.parse(rawArgs);
      return await commandSendEmail(args);
    }
    case 'reply_to_email': {
      const args = ReplyToEmailArgs.parse(rawArgs);
      return await commandReplyEmail(args);
    }
    case 'forward_email': {
      const args = ForwardEmailArgs.parse(rawArgs);
      return await commandForwardEmail(args);
    }
    default:
      throw new Error(`Unknown AI tool name: ${name}`);
  }
}
