// ============================================================
// HTMLレポートを生成する
// ============================================================

/**
 * 生徒1人分のHTMLレポートを生成する
 * @param {Object} student - 生徒データ
 * @returns {string} HTML文字列
 */
function generateReportHtml(student) {
  const scores = [
    { label: "理解度", value: student.understanding, color: "#3B82F6" },
    { label: "満足度", value: student.satisfaction, color: "#10B981" },
    { label: "難易度", value: student.difficulty,   color: "#F59E0B" },
  ];

  const average = (
    (student.understanding + student.satisfaction + student.difficulty) / 3
  ).toFixed(1);

  const barChart = scores
    .map(
      ({ label, value, color }) => `
      <div style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span style="font-size:14px; color:#374151;">${label}</span>
          <span style="font-size:14px; font-weight:bold; color:${color};">${value} / 5</span>
        </div>
        <div style="background:#E5E7EB; border-radius:9999px; height:12px; overflow:hidden;">
          <div style="background:${color}; width:${(value / 5) * 100}%; height:100%; border-radius:9999px;"></div>
        </div>
      </div>`
    )
    .join("");

  const stars = (value) => "★".repeat(value) + "☆".repeat(5 - value);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>授業評価レポート</title>
</head>
<body style="margin:0; padding:0; background:#F3F4F6; font-family:'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width:560px; margin:32px auto; background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- ヘッダー -->
    <div style="background:linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); padding:32px 32px 24px;">
      <p style="color:rgba(255,255,255,0.8); font-size:13px; margin:0 0 8px;">授業評価レポート</p>
      <h1 style="color:#FFFFFF; font-size:24px; margin:0 0 4px;">${student.name} さん</h1>
      <p style="color:rgba(255,255,255,0.9); font-size:15px; margin:0;">「${student.courseName}」の受講結果</p>
    </div>

    <!-- 総合スコア -->
    <div style="padding:24px 32px; background:#F9FAFB; border-bottom:1px solid #E5E7EB;">
      <p style="color:#6B7280; font-size:13px; margin:0 0 8px; text-transform:uppercase; letter-spacing:0.05em;">総合評価</p>
      <div style="display:flex; align-items:baseline; gap:8px;">
        <span style="font-size:48px; font-weight:bold; color:#6366F1;">${average}</span>
        <span style="font-size:20px; color:#9CA3AF;">/ 5.0</span>
      </div>
      <p style="font-size:20px; color:#F59E0B; margin:4px 0 0;">${stars(Math.round(average))}</p>
    </div>

    <!-- スコア詳細 -->
    <div style="padding:24px 32px;">
      <p style="color:#111827; font-size:15px; font-weight:bold; margin:0 0 16px;">項目別スコア</p>
      ${barChart}
    </div>

    <!-- コメント -->
    ${student.comment ? `
    <div style="padding:0 32px 24px;">
      <p style="color:#111827; font-size:15px; font-weight:bold; margin:0 0 12px;">あなたのコメント</p>
      <div style="background:#F3F4F6; border-left:4px solid #6366F1; padding:16px; border-radius:0 8px 8px 0;">
        <p style="color:#374151; font-size:14px; line-height:1.7; margin:0;">${student.comment}</p>
      </div>
    </div>` : ""}

    <!-- フッター -->
    <div style="padding:20px 32px; background:#F9FAFB; border-top:1px solid #E5E7EB; text-align:center;">
      <p style="color:#9CA3AF; font-size:12px; margin:0;">このメールは自動送信されています</p>
    </div>
  </div>
</body>
</html>`;
}
