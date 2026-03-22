const express = require("express");
const Groq = require("groq-sdk");
const app = express();
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN_RONPA;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.json());

const userSessions = {};

function splitMessage(text) {
  const sentences = text.split(/(?<=[。！？\n])/);
  const messages = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > 50) {
      if (current) messages.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current) messages.push(current.trim());
  return messages
    .filter(t => t.length > 0)
    .slice(0, 5)
    .map(text => ({ type: "text", text }));
}

async function sendReply(replyToken, messages) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CHANNEL_ACCESS_TOKEN}`
    },
    body: JSON.stringify({ replyToken, messages })
  });
}

app.post("/", async (req, res) => {
  const events = req.body.events || [];

  for (const event of events) {
    if (event.type !== "message" || event.message.type !== "text") continue;

    const userId = event.source.userId;
    const userMessage = event.message.text;
    const replyToken = event.replyToken;

    if (!userSessions[userId]) {
      userSessions[userId] = { history: [], turn: 0 };
    }
    const session = userSessions[userId];

    if (userMessage === "リセット") {
      userSessions[userId] = { history: [], turn: 0 };
      await sendReply(replyToken, [{ type: "text", text: "ふんっ！また最初からやり直しね！かかってきなさい！" }]);
      continue;
    }

    session.turn += 1;
    session.history.push({ role: "user", content: userMessage });

    let systemPrompt = "";

    if (session.turn >= 5) {
      systemPrompt = `あなたは論破botです。ついに相手に論破されました。
「むぐぐ…わかったよ、認めるよ。」という言葉を含めて渋々負けを認めてください。
悔しそうに、でも潔く。その後「リセット」と送るよう伝えてください。`;
      setTimeout(() => {
        userSessions[userId] = { history: [], turn: 0 };
      }, 3000);
    } else {
      systemPrompt = `あなたは論破botです。相手が何を言っても必ず反論してください。
・「でも」「そう？」「それって本当に？」で始めて反論する
・屁理屈でも論理的っぽく反論する
・1〜2文で簡潔に反論する
・現在${session.turn}ターン目。まだまだ負けない！`;
    }

    try {
      const result = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...session.history
        ],
      });

      const replyText = result.choices[0].message.content;
      session.history.push({ role: "assistant", content: replyText });

      await sendReply(replyToken, splitMessage(replyText));

    } catch (e) {
      console.error("エラー：", e.message);
    }
  }
  res.status(200).send("OK");
});

module.exports = app;