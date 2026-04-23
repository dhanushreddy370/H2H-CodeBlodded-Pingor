const { google } = require('googleapis');
const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");

/**
 * Returns a set of tools configured with a specific user's Gmail client.
 */
const getTools = (authClient) => {
  const gmail = google.gmail({ version: 'v1', auth: authClient });

  const SearchEmailsTool = new DynamicStructuredTool({
    name: "search_emails",
    description: "Search the user's Gmail inbox for specific emails based on a query string (e.g., 'subject:budget', 'from:boss@company.com', or keywords). Returns a list of thread snippets and IDs.",
    schema: z.object({
      query: z.string().describe("The search query string for Gmail."),
      maxResults: z.number().optional().default(5).describe("Maximum number of threads to return.")
    }),
    func: async ({ query, maxResults }) => {
      try {
        const params = { userId: 'me' };
        if (query && query.trim() !== '') {
          params.q = query;
        }
        params.maxResults = maxResults || 5;
        
        const res = await gmail.users.threads.list(params);
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
      to: z.string().optional().describe("The recipient email address(es)."),
      subject: z.string().optional().describe("The subject of the email (optional)."),
      body: z.string().optional().describe("The FULL plain text body of the drafted email. You MUST include the greeting ('Hi [Name]') and the sign-off ('Regards, [Name]') inside this exact body string. DO NOT JUST PUT THE RAW MESSAGE."),
      threadId: z.string().optional().describe("Optional thread ID if this is a reply.")
    }).passthrough(),
    func: async (args) => {
      try {
        const to = args.to || args.recipient;
        let body = args.body || args.message || args.content;
        let subject = args.subject;
        const threadId = args.threadId;

        if (!to || !body) {
          return "System Error: You failed to provide the required 'to' and 'body' parameters. Please try the tool call again with to and body.";
        }
        
        const finalSubject = subject || "No Subject";
        
        const messageLines = [
          `To: ${to}`,
          `Subject: ${finalSubject}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/plain; charset="UTF-8"`,
          `Content-Transfer-Encoding: 7bit`,
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

  const SendEmailTool = new DynamicStructuredTool({
    name: "send_email",
    description: "Immediately sends an email to the specified recipient. CRITICAL GUARDRAIL: NEVER use this tool unless the user has reviewed the exact email draft in chat and explicitly given you permission to send it (e.g., 'looks good, send it'). If they haven't reviewed it yet, do not use this tool; just output the draft conversational text.",
    schema: z.object({
      to: z.string().optional().describe("The recipient email address(es)."),
      subject: z.string().optional().describe("The subject of the email (optional)."),
      body: z.string().optional().describe("The FULL plain text body of the email. You MUST include the greeting ('Hi [Name]') and the sign-off ('Regards, [Name]') inside this exact body string. DO NOT JUST PUT THE RAW MESSAGE."),
      threadId: z.string().optional().describe("Optional thread ID if this is a reply.")
    }).passthrough(),
    func: async (args) => {
      try {
        const to = args.to || args.recipient;
        let body = args.body || args.message || args.content;
        let subject = args.subject;
        const threadId = args.threadId;

        if (!to || !body) {
          return "System Error: You failed to provide the required 'to' and 'body' parameters. Please try the tool call again with to and body.";
        }
        
        const finalSubject = subject || "No Subject";

        const messageLines = [
          `To: ${to}`,
          `Subject: ${finalSubject}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/plain; charset="UTF-8"`,
          `Content-Transfer-Encoding: 7bit`,
          '',
          body
        ];

        const emailRaw = Buffer.from(messageLines.join('\n')).toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const requestBody = {
          raw: emailRaw
        };

        if (threadId) {
          requestBody.threadId = threadId;
        }

        await gmail.users.messages.send({ userId: 'me', requestBody });
        return `Successfully sent the email to ${to} with subject "${subject}". Inform the user.`;
      } catch (e) {
        return `Failed to send email: ${e.message}`;
      }
    }
  });

  return [SearchEmailsTool, ReadThreadTool, DraftEmailTool, SendEmailTool];
};

module.exports = {
  getTools
};
