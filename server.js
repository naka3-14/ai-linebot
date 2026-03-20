const express = require("express");
const Groq = require("groq-sdk");
const path = require("path");

const app = express();
const client = new Groq({ apiKey: "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" });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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

app.post("/debate", async (req, res) => {
  const { topic } = req.body;
  try {
    const setup = await callAI(
      "あなたはマルチエージェントの司令塔です。議論の設定を50字以内で述べてください。",
      `テーマ：「${topic}」の議論を設定してください。`
    );

    const rounds = [];
    let lastPro = "";
    let lastCon = "";

    for (let i = 1; i <= 3; i++) {
      const proPrompt = i === 1
        ? `「${topic}」に賛成の立場で主張してください。150字以内で。`
        : `「${topic}」賛成派として、反対派の意見「${lastCon}」に反論してください。150字以内で。`;

      const pro = await callAI(
        "あなたは賛成派エージェントです。根拠を挙げて簡潔に主張してください。",
        proPrompt
      );

      const con = await callAI(
        "あなたは反対派エージェントです。根拠を挙げて簡潔に反論してください。",
        `「${topic}」反対派として、賛成派の意見「${pro}」に反論してください。150字以内で。`
      );

      rounds.push({ round: i, pro, con });
      lastPro = pro;
      lastCon = con;
    }

    const verdict = await callAI(
      "あなたはマルチエージェントの司令塔です。3ラウンドの議論を踏まえて150字以内で総括してください。",
      `テーマ：「${topic}」\n最終ラウンド 賛成派：「${lastPro}」\n最終ラウンド 反対派：「${lastCon}」\n総括してください。`
    );

    res.json({ setup, rounds, verdict });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log("サーバー起動！ http://localhost:3000"));