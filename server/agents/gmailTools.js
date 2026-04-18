const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const { getGmailClient } = require("../config/gmail");

// Utility to get the connected gmail client
const gmailClient = () => getGmailClient();

const SearchEmailsTool = new DynamicStructuredTool({
  name: "search_emails",
  description: "Search the user's Gmail inbox for specific emails based on a query string (e.g., 'subject:budget', 'from:boss@company.com', or keywords). Returns a list of thread snippets and IDs.",
  schema: z.object({
    query: z.string().describe("The search query string for Gmail."),
    maxResults: z.number().optional().default(5).describe("Maximum number of threads to return.")
  }),
  func: async ({ query, maxResults }) => {
    try {
      const gmail = gmailClient();
      const res = await gmail.users.threads.list({ userId: 'me', q: query, maxResults });
      if (!res.data.threads || res.data.threads.length === 0) return "No emails found for that query.";
      
      let resultsContext = "";
      for (const t of res.data.threads) {
        const threadDetails = await gmail.users.threads.get({ userId: 'me', id: t.id });
        const snippet = threadDetails.data.snippet;
        const messages = threadDetails.data.messages || [];
        const headers = messages[0]?.payload?.headers || [];
        const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
        const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
        
        resultsContext += `Thread ID: ${t.id}\nFrom: ${fromHeader ? fromHeader.value : 'Unknown'}\nSubject: ${subjectHeader ? subjectHeader.value : 'No Subject'}\nSnippet: ${snippet}\n\n`;
      }
      return resultsContext;
    } catch (e) {
      return `Failed to search emails: ${e.message}`;
    }
  }
});

const ReadThreadTool = new DynamicStructuredTool({
  name: "read_thread",
  description: "Reads the full content of a specific email thread. You must provide the exact Thread ID obtained from search_emails.",
  schema: z.object({
    threadId: z.string().describe("The exact ID of the thread to read.")
  }),
  func: async ({ threadId }) => {
    try {
      const gmail = gmailClient();
      const res = await gmail.users.threads.get({ userId: 'me', id: threadId });
      let fullText = `Full Thread ${threadId}:\n`;
      const messages = res.data.messages || [];
      messages.forEach((msg, idx) => {
          let bodyData = "";
          if (msg.payload.body.data) {
             bodyData = Buffer.from(msg.payload.body.data, 'base64').toString('utf8');
          } else if (msg.payload.parts) {
             const plainPart = msg.payload.parts.find(p => p.mimeType === 'text/plain');
             if (plainPart && plainPart.body.data) {
                 bodyData = Buffer.from(plainPart.body.data, 'base64').toString('utf8');
             }
          }
          fullText += `--- Message ${idx + 1} ---\n${bodyData.substring(0, 1000)}\n`; 
      });
      return fullText || "No readable text found in thread. Try forming a response based off the snippet.";
    } catch (e) {
      return `Failed to read thread: ${e.message}`;
    }
  }
});

const DraftEmailTool = new DynamicStructuredTool({
  name: "create_draft",
  description: "Creates an email draft in the user's Gmail account for them to review, edit, or send. Use this when instructed to reply to an email or draft a new one.",
  schema: z.object({
    to: z.string().describe("The recipient email address(es)."),
    subject: z.string().describe("The subject of the email."),
    body: z.string().describe("The full plain text body of the drafted email."),
    threadId: z.string().optional().describe("Optional thread ID if this is a reply.")
  }),
  func: async ({ to, subject, body, threadId }) => {
    try {
      const gmail = gmailClient();
      
      const messageLines = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ];

      const emailRaw = Buffer.from(messageLines.join('\n')).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const draftBody = {
        message: {
          raw: emailRaw
        }
      };

      if (threadId) {
        draftBody.message.threadId = threadId;
      }

      await gmail.users.drafts.create({ userId: 'me', requestBody: draftBody });
      return `Successfully created draft to ${to} with subject "${subject}". The user can review it in their Gmail Drafts folder. Inform the user.`;
    } catch (e) {
      return `Failed to create draft: ${e.message}`;
    }
  }
});

module.exports = {
  SearchEmailsTool,
  ReadThreadTool,
  DraftEmailTool
};
