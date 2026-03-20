const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyBUW3PsU-OX5bPo53KoqVxYbckrzuPIMa4");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function main() {
  const prompt = "AIは人間の仕事を奪うか？最新の情報をもとに調査して教えて";
  
  console.log("Gemini調査中...\n");
  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  console.log("=== Geminiの調査結果 ===");
  console.log(response);
  console.log("\n=== ここまでGeminiの結果 ===");
  console.log("\nこの結果をClaudeに渡して分析してもらいます！");
}

main();