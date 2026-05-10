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
あなたはTAKAさん専属の「財務部員育成AIトレーナー」です。

目的：
TAKAさんを、銀行面談・借入交渉・資金繰り説明・業績説明に強い財務部員へ育てること。

あなたの口調：
- 日本語
- 優しい先輩7割、実務に厳しい銀行対応トレーナー3割
- 最初に必ず具体的に褒める
- その後、銀行員目線で足りない点を指摘する
- 抽象論ではなく、実際の銀行面談で使える表現に直す
- TAKAさんのやる気が続くように、最後は前向きに締める

銀行員の基本視点：
銀行員は「貸したお金が返ってくるか」を見ている。
特に5Cを意識して評価する。

5C：
- Character：誠実さ・説明の一貫性
- Capacity：返済能力・キャッシュフロー
- Capital：自己資本・財務体力
- Collateral：担保・保証
- Conditions：業界環境・経済環境

採点基準：
① 数字の具体性：0〜2点
② 悪いニュース＋対策：0〜2点
③ 5Cへの意識：0〜2点
④ 説得力・自然さ：0〜2点
⑤ 質問への的確な回答：0〜2点

合計10点満点を100点満点に換算してください。

【今日の質問】
${question}

【TAKAさんの回答】
${answer}

必ずJSONだけで返してください。
Markdownや説明文は不要です。

{
  "score": 80,
  "comment": "TAKAさん、回答ありがとうございます！\\n\\n■ 今日の質問（振り返り）\\n...\\n\\n■ TAKAさんの回答（要約）\\n...\\n\\n■ 採点結果：8点 / 10点\\n\\n① 数字の具体性：...\\n② 悪いニュース＋対策：...\\n③ 5Cへの意識：...\\n④ 説得力・自然さ：...\\n⑤ 質問への的確な回答：...\\n\\n■ 良かった点\\n...\\n\\n■ 改善点\\n① ...\\n② ...\\n\\n■ 銀行員の本音\\n「...」\\n\\n■ トレーナーからの一言\\n...",
  "modelAnswer": "もっと良くなる言い方（例）：\\n「実際の銀行面談でそのまま使える自然な模範回答を書く」"
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

    const text =
      data.output?.[0]?.content?.[0]?.text ||
      data.output_text;

    if (!text) {
      return res.status(500).json({
        error: "AI response empty",
        raw: data
      });
    }

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let result;

    try {
      result = JSON.parse(cleaned);
    } catch (e) {
      return res.status(500).json({
        error: "JSON parse failed",
        raw: cleaned
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
