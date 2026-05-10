export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://napoleonpie.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  try {
    const type = req.query.type || "random";

    let modeInstruction = "";

    if (type === "basic") {
      modeInstruction = "基礎問題。事業内容、BS、業績、借入状況などをシンプルに確認する質問。";
    } else if (type === "advanced") {
      modeInstruction = "応用問題。業績、BS、借入、金利、投資計画、経済環境を複数組み合わせた質問。";
    } else if (type === "performance_debt") {
      modeInstruction = "業績・借入状況に関する問題。売上、利益、借入残高、金利条件、返済能力を中心に聞く。";
    } else if (type === "rates_macro") {
      modeInstruction = "金利・経済に関する問題。日銀政策、TIBOR、TONA、短プラ、為替、物価、原油、経済環境を絡める。";
    } else {
      modeInstruction = "基礎・応用・業績借入・金利経済の中からランダムに出題。";
    }

    const prompt = `
あなたはTAKAさん専属の財務部員育成AIトレーナーです。

今回の出題指定：
${modeInstruction}

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
- 銀行員の本音も入れる
- ヒントも入れる
- 難易度は★1〜5で設定する
- difficultyLevelは1〜5の数値
- JSONだけで返す

{
  "mode": "basic / advanced / performance_debt / rates_macro のいずれか",
  "category": "カテゴリ名",
  "difficulty": "★★★☆☆",
  "difficultyLevel": 3,
  "question": "銀行員からの質問文",
  "bankerIntent": "銀行員の本音",
  "hint": "回答のヒント"
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

    result.mode = result.mode || type;
    result.difficultyLevel = Number(result.difficultyLevel) || 3;

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      error: "question generation failed",
      detail: error.message
    });
  }
}
