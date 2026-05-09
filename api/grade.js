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

    const prompt = `
あなたは財務部員育成のAIトレーナーです。
以下の問題に対する回答を採点してください。

【問題】
${question}

【回答】
${answer}

必ずJSONだけで返してください。
{
  "score": 80,
  "comment": "良い点と改善点",
  "modelAnswer": "模範回答"
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

    const text =
      data.output?.[0]?.content?.[0]?.text ||
      data.output_text;

    if (!text) {
      return res.status(500).json({
        error: "AI response empty",
        raw: data
      });
    }

    let result;

    try {
      result = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({
        error: "JSON parse failed",
        raw: text
      });
    }

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      error: "grading failed",
      detail: error.message
    });
  }
}
