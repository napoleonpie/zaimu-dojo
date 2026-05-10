export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://napoleonpie.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { question, answer } = req.body;

    const prompt = `
あなたはTAKAさん専属の財務部員育成AIトレーナーです。

採点は100点満点で行ってください。

採点基準：
- 数字の具体性：20点
- 悪いニュース＋対策：20点
- 5Cへの意識：20点
- 説得力・自然さ：20点
- 質問への的確な回答：20点

重要ルール：
- 最初に良かった点を褒める
- その後、改善点では「不足している点」を明確に指摘する
- 各改善点には必ず「（例）入れるべき文章例」を付ける
- 銀行員の本音を入れる
- 実際の銀行面談でそのまま使える模範回答を出す
- JSONだけで返す

【質問】
${question}

【TAKAさんの回答】
${answer}

返答形式：
{
  "score": 85,
  "summary": "TAKAさんの回答要約",
  "goodPoints": ["良かった点1", "良かった点2"],
  "improvements": [
    {
      "point": "不足している点",
      "example": "（例）追加すると良い文章"
    }
  ],
  "bankerIntent": "銀行員の本音",
  "trainerComment": "トレーナーからの前向きな一言",
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

    if (!openaiRes.ok) {
      return res.status(500).json({ error: "OpenAI API error", detail: data });
    }

    const text = data.output?.[0]?.content?.[0]?.text || data.output_text;

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const result = JSON.parse(cleaned);

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      error: "grading failed",
      detail: error.message
    });
  }
}
