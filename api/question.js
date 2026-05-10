export default async function handler(req, res) {

  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://napoleonpie.github.io"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "GET only"
    });
  }

  try {

    const type = req.query.type || "random";

    let modeInstruction = "";
    let fixedMode = "random";

    if (type === "basic") {

      fixedMode = "basic";

      modeInstruction =
        "基礎問題を作成してください。事業内容、BS、PL、借入状況、資金繰りなどをシンプルに確認する質問。";

    }
    else if (type === "advanced") {

      fixedMode = "advanced";

      modeInstruction =
        "応用問題を作成してください。業績、BS、借入、金利、投資計画、経済環境など複数情報を組み合わせた銀行面談質問。";

    }
    else if (type === "performance_debt") {

      fixedMode = "performance_debt";

      modeInstruction =
        "業績・借入状況に関する問題を作成してください。売上、利益、借入残高、DSCR、返済能力、金利条件を中心に質問。";

    }
    else if (type === "rates_macro") {

      fixedMode = "rates_macro";

      modeInstruction =
        "金利・経済に関する問題を作成してください。日銀政策、TIBOR、TONA、短プラ、インフレ、原油、為替を絡めた質問。";

    }
    else {

      fixedMode = "random";

      modeInstruction =
        "基礎・応用・業績借入・金利経済の中からランダムで問題を作成してください。";
    }

    const prompt = `
あなたはTAKAさん専属の財務部員育成AIトレーナーです。

${modeInstruction}

【TAKAさんの会社】
- 有機溶剤リサイクル業
- ESG・環境ビジネス
- 銀行借入あり
- 設備投資あり
- 金利上昇影響を受ける
- 銀行面談頻度が高い

【問題作成ルール】
- 実際の銀行員が聞きそうな質問
- 単純な暗記問題は禁止
- 説明力・銀行対応力を鍛える
- 銀行員の本音を入れる
- 回答ヒントを入れる
- 難易度を設定する
- JSONのみ返す
- 説明文は禁止

JSON形式：

{
  "category": "カテゴリ名",
  "difficulty": "★★★☆☆",
  "difficultyLevel": 3,
  "question": "銀行員からの質問",
  "bankerIntent": "銀行員の本音",
  "hint": "回答ヒント"
}
`;

    const openaiRes = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            \`Bearer \${process.env.OPENAI_API_KEY}\`
        },

        body: JSON.stringify({
          model: "gpt-4.1-mini",

          input: prompt,

          temperature: 0.9
        })
      }
    );

    const data = await openaiRes.json();

    if (!openaiRes.ok) {

      return res.status(500).json({
        error: "OpenAI API error",
        detail: data
      });
    }

    const text =
      data.output?.[0]?.content?.[0]?.text
      || data.output_text
      || "";

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let result = {};

    try {

      result = JSON.parse(cleaned);

    } catch (parseError) {

      return res.status(500).json({
        error: "JSON parse failed",
        raw: cleaned
      });
    }

    result.mode = fixedMode;

    result.category =
      result.category || "財務・銀行面談";

    result.difficulty =
      result.difficulty || "★★★☆☆";

    result.difficultyLevel =
      Number(result.difficultyLevel) || 3;

    result.question =
      result.question || "問題生成失敗";

    result.bankerIntent =
      result.bankerIntent || "";

    result.hint =
      result.hint || "";

    return res.status(200).json(result);

  }
  catch (error) {

    return res.status(500).json({
      error: "question generation failed",
      detail: error.message
    });
  }
}
