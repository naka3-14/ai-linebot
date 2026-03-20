const express = require("express");
const crypto = require("crypto");
const Groq = require("groq-sdk");

const app = express();
const groq = new Groq({ apiKey: "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" });

const CHANNEL_SECRET = "615a961c51b41986398c4a23a7940c3a";
const CHANNEL_ACCESS_TOKEN = "9dlppFHM3mxiunLHCzHlbX8OkCrBdHVzPjCEYbHViQIt5m9ZCfph0PXZYqveM+i873WB1nhYRGBVcSXYWc7AcV6MS1uhP1WLK6UHQOftmykHBRVRlVauzlP8/2rTBcxgsmLdfzsk1sCOPdoFMdChawdB04t89/1O/w1cDnyilFU=";

app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

app.post("/webhook", async (req, res) => {
  const signature = req.headers["x-line-signature"];
  const hmac = crypto.createHmac("SHA256", CHANNEL_SECRET);
  hmac.update(req.rawBody);
  const digest = hmac.digest("base64");
  if (signature !== digest) return res.status(401).send("Invalid signature");

  res.status(200).send("OK");

  const events = req.body.events;
  for (const event of events) {
    if (event.type !== "message" || event.message.type !== "text") continue;

    const userMessage = event.message.text;
    const replyToken = event.replyToken;

    try {
      const result = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "あなたは親切なAIアシスタントです。日本語で簡潔に答えてください。" },
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
});

app.listen(3000, () => console.log("LINE bot起動！ポート3000"));