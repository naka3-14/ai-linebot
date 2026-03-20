const Anthropic = require("@anthropic-ai/sdk");
const client = new Anthropic();

async function main() {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: "こんにちは！自己紹介して" }],
  });
  console.log(message.content[0].text);
}

main();