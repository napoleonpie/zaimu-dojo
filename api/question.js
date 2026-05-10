export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://napoleonpie.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  try {
    const mode = Math.random() < 0.5 ? "basic" : "advanced";

    const prompt = `
あなたはTAKAさん専属の財務部員育成AIトレーナーです。

今回の出題モード：
${mode === "basic" ? "基礎問題" : "応用問題"}

基礎問題の場合：
- 業績、BS、借入残高、金利条件、事業内容、投資計画、経済指標などをシンプルに聞く
- 30秒で回答できる銀行面談の基礎確認にする

応用問題の場合：
- 業績、BS、借入、金利、投資計画、経済状況、銀行員の本音を複数組み合わせる
- 実際の銀行面談で深掘りされそうな質問にする

TAKAさんの会社情報：
- 有機溶剤リサイクル業
- 環境・ESG・化学業界
- 銀行融資あり
- 設備投資あり
- 新規事業あり
- 金利上昇局面を意識する必要がある

出力は必ずJSONだけ。

{
  "mode": "basic または advanced",
  "category": "資金繰り・借入・業績・BS・事業内容・投資計画・経済動向など",
  "difficulty": "★☆☆☆☆〜★★★★★",
  "difficultyLevel": 1,
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

    result.mode = result.mode || mode;
    result.difficultyLevel = Number(result.difficultyLevel) || 3;

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      error: "question generation failed",
      detail: error.message
    });
  }
}
