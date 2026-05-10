export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://napoleonpie.github.io");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  try {
    const type = req.query.type || "random";

    const instructions = {
      basic:
        "基礎問題。事業内容、BS、PL、業績、借入状況、資金繰りなどをシンプルに確認する質問。",

      company_info:
  "会社の全体状況を銀行員が理解するための質問。人事だけに偏らず、会社のあらゆる内容を幅広く聞くこと。例えば、従業員数、新入社員、離職率、福利厚生、役員構成、組織変更、工場の土地面積、生産能力、設備稼働率、海外子会社の所在地・事業内容・業績、国内拠点、許認可、主要顧客、主要仕入先、新規事業、設備投資、DX化、ESG対応、品質管理、事故対応、為替影響、原材料価格、採用状況、賃上げ、社内教育、研究開発、競合との差別化など、会社理解につながる多様な質問をランダムに作成すること。同じテーマを連続で出題しないこと。人事系に偏らないこと。会社全体を理解する質問にすること。",
    
      advanced:
        "応用問題。業績、BS、借入、金利、投資計画、経済環境、会社の状況を複数組み合わせた銀行面談質問。",

      performance_debt:
        "業績・借入状況に関する問題。売上、利益、借入残高、DSCR、返済能力、金利条件を中心に質問。",

      rates_macro:
        "金利・経済に関する問題。日銀政策、TIBOR、TONA、短プラ、インフレ、原油、為替を絡めた質問。",

      random:
        "基礎・会社の状況・応用・業績借入・金利経済の中からランダムで問題を作成。"
    };

    const fixedMode = instructions[type] ? type : "random";
    const modeInstruction = instructions[fixedMode];

    const prompt = `
あなたはTAKAさん専属の財務部員育成AIトレーナーです。

今回の出題指定：
${modeInstruction}

TAKAさんの会社：
- 有機溶剤リサイクル業
- ESG・環境ビジネス
- 銀行借入あり
- 設備投資あり
- 海外子会社・国内工場・新規事業など、銀行から会社状況を聞かれる可能性がある
- 金利上昇影響を受ける
- 銀行面談頻度が高い

問題作成ルール：
- 実際の銀行員が聞きそうな質問にする
- 単純な暗記問題は禁止
- 説明力・銀行対応力を鍛える
- 銀行員の本音を入れる
- 回答ヒントを入れる
- 難易度を設定する
- JSONのみ返す
- Markdownは禁止
- コードブロックは禁止
- 前置き文章は禁止

必ずこのJSON形式だけで返してください。

{
  "category": "カテゴリ名",
  "difficulty": "★★★☆☆",
  "difficultyLevel": 3,
  "question": "銀行員からの質問",
  "bankerIntent": "銀行員の本音",
  "hint": "回答ヒント"
}
`;

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        temperature: 0.7
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
      data.output_text ||
      "";

    let cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // 文章が混ざった場合でも、最初の { から最後の } だけを取り出す
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    let result;

    try {
      result = JSON.parse(cleaned);
    } catch (e) {
      return res.status(500).json({
        error: "JSON parse failed",
        raw: cleaned,
        original: text
      });
    }

    result.mode = fixedMode;
    result.category = result.category || "会社の状況";
    result.difficulty = result.difficulty || "★★★☆☆";
    result.difficultyLevel = Number(result.difficultyLevel) || 3;
    result.question = result.question || "問題生成に失敗しました。";
    result.bankerIntent = result.bankerIntent || "";
    result.hint = result.hint || "";

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      error: "question generation failed",
      detail: error.message
    });
  }
}
