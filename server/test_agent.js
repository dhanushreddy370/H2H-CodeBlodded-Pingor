const { initAgent } = require('./agents/agentService');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').join(__dirname, '.env') });

async function debug() {
  try {
    const executor = await initAgent();
    // Enable verbose specifically to catch what goes wrong
    // It's already false in the code so we will just let it run
    const result = await executor.invoke({
      input: "write an email to dhanush111115@gmail.com telling him to meet me in JP Nagar at noon today for Vivek's wedding",
      chat_history: [
        ["user", "what was my last email about"],
        ["assistant", "It appears that your last email was from MongoDB Cloud..."]
      ]
    });
    console.log(result);
  } catch (err) {
    console.error("FAIL:", err.message);
    if (err.stack) console.error(err.stack);
  }
}

debug();
