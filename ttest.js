const Groq = require("groq-sdk");
const client = new Groq({ apiKey: "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" });

async function callAI(systemPrompt, userMessage) {
  const result = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
  });
  return result.choices[0].message.content;
}

async function main() {
  const topic = "AIは人間の仕事を奪うか";
  console.log(`\n🎯 テーマ：「${topic}」\n`);

  console.log("⚙️  司令塔AIが議論を設定中...");
  const setup = await callAI(
    "あなたはマルチエージェントの司令塔です。議論の設定を50字以内で述べてください。",
    `テーマ：「${topic}」の議論を設定してください。`
  );
  console.log(`📋 司令塔：${setup}\n`);

  console.log("✅ 賛成エージェント思考中...");
  const pro = await callAI(
    "あなたは賛成派エージェントです。根拠を1〜2つ挙げて120字以内で主張してください。",
    `「${topic}」に賛成の立場で主張してください。`
  );
  console.log(`👍 賛成派：${pro}\n`);

  console.log("❌ 反対エージェント思考中...");
  const con = await callAI(
    "あなたは反対派エージェントです。根拠を1〜2つ挙げて120字以内で反論してください。",
    `「${topic}」に反対の立場で。賛成派の意見：「${pro}」に反論してください。`
  );
  console.log(`👎 反対派：${con}\n`);

  console.log("⚖️  司令塔が総括中...");
  const verdict = await callAI(
    "あなたはマルチエージェントの司令塔です。議論を100字以内で総括してください。",
    `賛成派：「${pro}」反対派：「${con}」この議論を総括してください。`
  );
  console.log(`🏁 総括：${verdict}\n`);
}

main();