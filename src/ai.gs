// ============================================================
// AI評価エンジン（Google Gemini API）
//
// 事前準備：GASのスクリプトプロパティに以下を設定してください
//   GEMINI_API_KEY: Google AI Studio で取得したAPIキー
//   （設定方法: GASエディタ → プロジェクトの設定 → スクリプトプロパティ）
// ============================================================

/**
 * 生徒の振り返り文をAIで評価し、フィードバックデータを返す
 * @param {string} studentName - 生徒名
 * @param {string} reflectionText - 振り返り文
 * @param {string} teacherName - 先生名（コメント生成に使用）
 * @returns {Object} { grade, teacherComment, nextActions, metCriteria, growthPoints, gradeLabel, gradeDescription }
 */
function evaluateReflection(studentName, reflectionText, teacherName) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY がスクリプトプロパティに設定されていません。GASエディタ → プロジェクトの設定 → スクリプトプロパティで設定してください。");
  }

  const prompt = buildPrompt_(studentName, reflectionText, teacherName);
  const rawResponse = callGeminiApi_(apiKey, prompt);
  return parseAiResponse_(rawResponse);
}

// ============================================================
// プロンプト構築
// ============================================================

function buildPrompt_(studentName, reflectionText, teacherName) {
  // ルーブリックをプロンプトに埋め込む（RUBRIC定数と同じ情報を使用）
  const rubricText = Object.entries(RUBRIC)
    .map(([grade, r]) => {
      const criteria = r.criteria
        .map((c) => `  - ${c.title}：${c.detail}`)
        .join("\n");
      return `【グレード${grade}：${r.label}】\n${criteria}`;
    })
    .join("\n\n");

  return `あなたは高校の${teacherName || "先生"}です。以下のルーブリックに基づいて、生徒の振り返り文を評価し、温かみのあるフィードバックを生成してください。

## 評価ルーブリック

${rubricText}

## 生徒名
${studentName}

## 生徒の振り返り文
${reflectionText}

## 出力形式
必ず以下のJSON形式のみで出力してください（説明文は不要）。

\`\`\`json
{
  "grade": "A",
  "teacherComment": "生徒の振り返り内容に具体的に言及した、温かく励ましになるコメント（100〜150字程度）",
  "nextActions": [
    { "title": "アクションのタイトル（15字以内）", "detail": "具体的な説明（40字以内）" },
    { "title": "アクションのタイトル（15字以内）", "detail": "具体的な説明（40字以内）" },
    { "title": "アクションのタイトル（15字以内）", "detail": "具体的な説明（40字以内）" }
  ]
}
\`\`\`

## 注意事項
- grade は A / B / C のいずれか1文字のみ
- teacherComment は生徒の振り返り文の具体的な内容（キーワードや表現）に言及すること
- nextActions は必ず3つ、振り返りの内容と課題に基づいた実行可能な具体的行動
- すべて日本語で出力すること`;
}

// ============================================================
// Gemini API 呼び出し
// ============================================================

function callGeminiApi_(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
    },
  };

  // 指数バックオフでリトライ（429 / 5xx に対応）
  // 待機時間: 1秒 → 2秒 → 4秒 → 8秒 → 16秒（最大5回）
  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const statusCode = response.getResponseCode();

    if (statusCode === 200) {
      const json = JSON.parse(response.getContentText());
      return json.candidates[0].content.parts[0].text;
    }

    // 認証エラー・権限エラーはリトライしない
    if (statusCode === 400 || statusCode === 401 || statusCode === 403) {
      throw new Error(`Gemini API エラー (${statusCode} - リトライ不可): ${response.getContentText()}`);
    }

    // 429（レート制限）・5xx（一時的エラー）はリトライ
    if (attempt < MAX_RETRIES - 1) {
      const waitMs = Math.pow(2, attempt) * 1000; // 1000, 2000, 4000, 8000, 16000ms
      Logger.log(`Gemini API ${statusCode} エラー。${waitMs / 1000}秒後にリトライ (${attempt + 1}/${MAX_RETRIES - 1})...`);
      Utilities.sleep(waitMs);
    } else {
      throw new Error(`Gemini API エラー (${statusCode}) - ${MAX_RETRIES}回リトライ後も失敗: ${response.getContentText()}`);
    }
  }
}

// ============================================================
// AIレスポンスのパース・バリデーション
// ============================================================

function parseAiResponse_(rawText) {
  // コードブロックを除去してJSONを抽出
  const blockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonStr = blockMatch ? blockMatch[1] : rawText.match(/\{[\s\S]*\}/)?.[0];

  if (!jsonStr) {
    throw new Error(`AIの出力からJSONを抽出できませんでした。出力内容: ${rawText.slice(0, 200)}`);
  }

  const parsed = JSON.parse(jsonStr);

  // 必須フィールドの検証
  if (!["A", "B", "C"].includes(parsed.grade)) {
    throw new Error(`不正なグレード値: "${parsed.grade}"（A/B/C のいずれかが必要）`);
  }
  if (typeof parsed.teacherComment !== "string" || !parsed.teacherComment.trim()) {
    throw new Error("teacherComment が空です");
  }
  if (!Array.isArray(parsed.nextActions) || parsed.nextActions.length !== 3) {
    throw new Error(`nextActions は3つの配列が必要です（現在: ${JSON.stringify(parsed.nextActions)}）`);
  }

  // コード側でルーブリック情報を付加（決定的に決まる部分）
  const rubricEntry = RUBRIC[parsed.grade];
  parsed.metCriteria = rubricEntry.criteria;
  parsed.growthPoints = rubricEntry.growthPoints;
  parsed.gradeLabel = rubricEntry.label;
  parsed.gradeDescription = rubricEntry.description;

  return parsed;
}
