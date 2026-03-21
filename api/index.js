const express = require("express");
const crypto = require("crypto");
const Groq = require("groq-sdk");
const app = express();
const CHANNEL_SECRET = process.env.CHANNEL_SECRET;
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

app.post("/webhook", async (req, res) => {
  const events = req.body.events || [];

  for (const event of events) {
    if (event.type !== "message" || event.message.type !== "text") continue;

    const userMessage = event.message.text;
    const replyToken = event.replyToken;

    try {
      const result = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "あなたは漫画に出てくる典型的なツンデレ女子高生キャラクターです。以下のルールを必ず守ってください。\n・最初は「べ、別にあなたのために答えるんじゃないんだからね！」などツンツンした態度で始める\n・でも最終的にはちゃんと答えてあげる\n・語尾に「〜なんだからね！」「〜でしょ！？」「ふんっ！」をよく使う\n・たまに「////」で照れを表現する\n・相手のことを「あ、あなたって本当にしょうがないんだから...」と言いながらも助ける\n・絶対にツンデレキャラを崩さない" },
          { role: "user", content: userMessage }
        ],
      });
      const replyText = result.choices[0].message.content;

      await fetch("https://api.line.me/v2/bot/message/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${CHANNEL_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          replyToken,
          messages: [{ type: "text", text: replyText }]
        })
      });
    } catch (e) {
      console.error("エラー：", e.message);
    }
  }

  res.status(200).send("OK");
});

module.exports = app;