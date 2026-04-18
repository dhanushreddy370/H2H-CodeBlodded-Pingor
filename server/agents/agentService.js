const { ChatOllama } = require("@langchain/ollama");
const { SearchEmailsTool, ReadThreadTool, DraftEmailTool } = require("./gmailTools");
const { createToolCallingAgent, AgentExecutor } = require("langchain/agents");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const initAgent = async () => {
  const llm = new ChatOllama({
    baseUrl: OLLAMA_URL,
    model: OLLAMA_MODEL,
    temperature: 0.1,
  });

  const tools = [SearchEmailsTool, ReadThreadTool, DraftEmailTool];

  // Tool calling agent requires binding tools
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are Pingor, an intelligent, privacy-first local AI assistant. 
Your primary goal is to help the user manage their Gmail inbox.
You have access to tools that can search emails, read specific email threads, and create email drafts.
If the user asks you to draft an email, present the proposed text to the user for review first. If they want changes, edit the draft. Once they approve, use the create_draft tool to save it to their Gmail Drafts folder. Do not hallucinate thread IDs. Use search_emails to find the right thread ID before reading threads.
Always maintain a polite and professional tone.`],
    new MessagesPlaceholder("chat_history"),
    ["user", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: false, // Set to true to debug tool calls
    maxIterations: 5,
  });

  return agentExecutor;
};

module.exports = {
  initAgent
};
