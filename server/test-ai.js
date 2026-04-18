const { classifyThread } = require('./services/aiService');

async function testOllama() {
  console.log("Testing Ollama aiService connection...\n");
  
  const testCases = [
    {
      subject: "Action Required: Please approve the Q3 budget",
      snippet: "Hi team, please review the attached spreadsheet and approve the budget by EOD today so we can finalize the quarter."
    },
    {
      subject: "Lunch on Friday?",
      snippet: "Hey, are we still on for lunch at the new sushi place this Friday?"
    }
  ];

  for (const [index, test] of testCases.entries()) {
    console.log(`--- Test Case ${index + 1} ---`);
    console.log(`Subject: "${test.subject}"`);
    console.log(`Snippet: "${test.snippet}"`);
    console.log("Waiting for AI response...");
    
    try {
      const result = await classifyThread(test.subject, test.snippet);
      console.log(`✅ Result Tag: "${result}"\n`);
    } catch (err) {
      console.error(`❌ Error: ${err.message}\n`);
    }
  }
}

testOllama();
