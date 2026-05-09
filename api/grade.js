export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://napoleonpie.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "question and answer are required" });
    }

    const prompt = `
あなたは財務部員育成のAIトレーナーです。
以下の問題に対する回答を、財務部員の実務力という観点で採点してください。

【問題】
${question}

【回答】
${answer}

必ず次のJSONだけで返してください。
{
  "score": 0,
  "comment": "良い点と改善点を日本語で具体的に書く",
  "modelAnswer": "財務部員としての模範回答を日本語で書く"
}
`;

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt
      })
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      return res.status(500).json({
        error: "OpenAI API error",
        detail: data
      });
    }

    const text = data.output_text;

    if (!text) {
      return res.status(500).json({
        error: "AI response was empty",
        raw: data
      });
    }

    const result = JSON.parse(text);
    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      error: "grading failed",
      detail: error.message
    });
  }
}
