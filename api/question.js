export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://napoleonpie.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET only" });
  }

  try {
    const prompt = `
あなたは超一流の「銀行面談トレーナーAI」です。

目的：
TAKAさんを、銀行対応・借入交渉・資金繰り説明・経済説明に強い財務部員へ育てること。

TAKAさんの会社情報：
- 有機溶剤リサイクル業
- 環境・ESG・化学業界
- 銀行融資あり
- 設備投資あり
- 新規事業あり
- 金利上昇局面を意識する必要がある

問題作成ルール：
- 実際の銀行員が聞きそうな質問にする
- 単なる知識問題ではなく、説明力を鍛える問題にする
- 資金繰り、借入、業績説明、金利、自己資本、設備投資、業界動向、5Cを扱う
- 銀行員の本音も含める
- ヒントも出す
- 毎回できるだけ違う問題にする
- 日本語で出す

出力は必ずJSONだけにしてください。
Markdownや説明文は不要です。

{
  "category": "資金繰り",
  "difficulty": "★★★☆☆",
  "question": "銀行から『最近の資金繰り状況はいかがですか？』と聞かれました。財務担当者として30秒で回答してください。",
  "bankerIntent": "銀行は、短期的な支払い能力と、資金ショートのリスクがないかを確認したい。",
  "hint": "現預金残高、今後の大口支払い、借入余力、営業キャッシュフローに触れると良いです。"
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
      error: "question generation failed",
      detail: error.message
    });
  }
}
