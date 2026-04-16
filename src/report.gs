// ============================================================
// HTMLレポート生成（メールクライアント対応・テーブルレイアウト）
//
// Gmail / Outlook 対応のため以下のルールを徹底しています:
//   - レイアウトはすべて <table> ベース（div/flexは使用しない）
//   - スタイルはすべてインライン（<style>ブロックはGmailが削除する）
//   - カスタムフォントは使用しない（@font-faceはほぼ全クライアント非対応）
//   - 本文幅は600px固定
// ============================================================

/**
 * 生徒1人分のHTMLメールを生成する
 * @param {Object} student - { name, email, reflection, className, studentNumber }
 * @param {Object} ai     - evaluateReflection() の戻り値
 * @param {string} teacherName - 先生名
 * @returns {string} HTML文字列
 */
function generateReportHtml(student, ai, teacherName) {
  const gc = gradeColor_(ai.grade);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>授業フィードバックレポート</title>
</head>
<body style="margin:0;padding:0;background-color:#fffbf5;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbf5;">
<tr><td align="center" style="padding:32px 12px;">

  <table width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">

    <!-- ヘッダー -->
    <tr><td align="center" style="padding-bottom:20px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr><td style="background-color:#ffffff;border-radius:9999px;padding:8px 20px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#b45309;font-weight:600;-webkit-box-shadow:0 2px 8px rgba(0,0,0,0.08);box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          &#128218; 授業フィードバックレポート
        </td></tr>
      </table>
    </td></tr>

    <!-- 生徒情報カード -->
    <tr><td style="padding-bottom:12px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:16px;-webkit-box-shadow:0 2px 12px rgba(180,120,60,0.10);box-shadow:0 2px 12px rgba(180,120,60,0.10);">
        <tr>
          <td width="60" style="padding:16px 0 16px 20px;vertical-align:middle;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr><td width="44" height="44" align="center" style="width:44px;height:44px;background-color:#fef3c7;border-radius:50%;font-size:22px;text-align:center;line-height:44px;">
                &#129489;&#8205;&#127891;
              </td></tr>
            </table>
          </td>
          <td style="padding:16px 20px 16px 12px;vertical-align:middle;">
            <p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#78716c;">生徒名</p>
            <p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#1c1917;">${escapeHtml_(student.name)}</p>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#78716c;">${escapeHtml_(student.className || "")}　出席番号 ${escapeHtml_(student.studentNumber || "")}</p>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- 評価ヒーロー -->
    <tr><td style="padding-bottom:12px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${gc.bg};border-radius:16px;border:2px solid ${gc.border};">
        <tr><td align="center" style="padding:24px 20px;">
          <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:${gc.label};letter-spacing:0.1em;">今回の評価</p>
          <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:72px;font-weight:900;line-height:1;color:${gc.text};">${ai.grade}</p>
          <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:${gc.text};">${escapeHtml_(ai.gradeLabel)}</p>
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${gc.text};">${escapeHtml_(ai.gradeDescription)}</p>
        </td></tr>
      </table>
    </td></tr>

    <!-- 生徒の振り返り -->
    <tr><td style="padding-bottom:12px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:16px;-webkit-box-shadow:0 2px 12px rgba(180,120,60,0.10);box-shadow:0 2px 12px rgba(180,120,60,0.10);">
        <tr><td style="padding:16px 20px 12px;">
          ${sectionHeading_("生徒の振り返り")}
        </td></tr>
        <tr><td style="padding:0 20px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:4px solid #fbbf24;">
            <tr><td style="padding:10px 14px;background-color:#fefce8;border-radius:0 8px 8px 0;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#44403c;line-height:1.8;">&#12300;${escapeHtml_(student.reflection)}&#12301;</p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>

    <!-- 評価の根拠 -->
    <tr><td style="padding-bottom:12px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:16px;-webkit-box-shadow:0 2px 12px rgba(180,120,60,0.10);box-shadow:0 2px 12px rgba(180,120,60,0.10);">
        <tr><td style="padding:16px 20px 12px;">
          ${sectionHeading_("評価の根拠")}
          <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;color:#78716c;letter-spacing:0.05em;">満たしていた基準</p>
          ${ai.metCriteria.map((c) => criteriaCard_(c.title, c.detail, "#fffbeb", "#fde68a", "#f59e0b", "#92400e", "#b45309", "&#10003;")).join("")}
          <p style="margin:12px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;color:#78716c;letter-spacing:0.05em;">さらに深めるポイント</p>
          ${ai.growthPoints.map((g) => criteriaCard_(g.title, g.detail, "#f9fafb", "#e5e7eb", "#d1d5db", "#374151", "#6b7280", "&#9651;")).join("")}
        </td></tr>
      </table>
    </td></tr>

    <!-- 先生からのコメント -->
    <tr><td style="padding-bottom:12px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:16px;-webkit-box-shadow:0 2px 12px rgba(180,120,60,0.10);box-shadow:0 2px 12px rgba(180,120,60,0.10);">
        <tr><td style="padding:16px 20px 12px;">
          ${sectionHeading_("先生からのコメント")}
        </td></tr>
        <tr><td style="padding:0 20px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;">
            <tr>
              <td width="52" style="padding:14px 0 14px 16px;vertical-align:top;">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr><td width="36" height="36" align="center" style="width:36px;height:36px;background-color:#dbeafe;border-radius:50%;border:2px solid #bfdbfe;font-size:18px;text-align:center;line-height:36px;">
                    &#128105;&#8205;&#127979;
                  </td></tr>
                </table>
              </td>
              <td style="padding:14px 16px;vertical-align:top;">
                <p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#1e3a5f;">${escapeHtml_(teacherName)}</p>
                <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#3b82f6;">担当教員</p>
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1e3a5f;line-height:1.8;">${escapeHtml_(ai.teacherComment)}</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>

    <!-- 次回のアクション -->
    <tr><td style="padding-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:16px;-webkit-box-shadow:0 2px 12px rgba(180,120,60,0.10);box-shadow:0 2px 12px rgba(180,120,60,0.10);">
        <tr><td style="padding:16px 20px 8px;">
          ${sectionHeading_("次回のアクション")}
        </td></tr>
        ${ai.nextActions.map((action, i) => `
        <tr><td style="padding:0 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom:1px solid #f5f5f4;">
            <tr>
              <td width="32" style="padding:10px 0;vertical-align:top;">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr><td width="22" height="22" align="center" style="width:22px;height:22px;background-color:#fbbf24;border-radius:50%;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#ffffff;text-align:center;line-height:22px;">
                    ${i + 1}
                  </td></tr>
                </table>
              </td>
              <td style="padding:10px 0 10px 8px;vertical-align:top;">
                <p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:#92400e;">${escapeHtml_(action.title)}</p>
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#78716c;">${escapeHtml_(action.detail)}</p>
              </td>
            </tr>
          </table>
        </td></tr>`).join("")}
        <tr><td style="padding:8px;"></td></tr>
      </table>
    </td></tr>

    <!-- フッター -->
    <tr><td align="center" style="padding-bottom:32px;">
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#a8a29e;">このメールは自動送信されています</p>
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>`;
}

// ============================================================
// 内部ヘルパー
// ============================================================

function gradeColor_(grade) {
  const map = {
    A: { bg: "#fef9c3", border: "#f59e0b", text: "#92400e", label: "#b45309" },
    B: { bg: "#dcfce7", border: "#22c55e", text: "#14532d", label: "#15803d" },
    C: { bg: "#f3f4f6", border: "#9ca3af", text: "#374151", label: "#4b5563" },
  };
  return map[grade] || map["C"];
}

function sectionHeading_(title) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
    <tr>
      <td width="4" style="width:4px;background-color:#fbbf24;border-radius:4px;">&nbsp;</td>
      <td style="padding-left:8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#b45309;">${escapeHtml_(title)}</td>
    </tr>
  </table>`;
}

function criteriaCard_(title, detail, bgColor, borderColor, badgeBg, titleColor, detailColor, symbol) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${bgColor};border:1px solid ${borderColor};border-radius:12px;margin-bottom:8px;">
    <tr>
      <td width="30" style="padding:10px 0 10px 14px;vertical-align:top;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr><td width="18" height="18" align="center" style="width:18px;height:18px;background-color:${badgeBg};border-radius:50%;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;color:#ffffff;text-align:center;line-height:18px;">
            ${symbol}
          </td></tr>
        </table>
      </td>
      <td style="padding:10px 14px;vertical-align:top;">
        <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:${titleColor};">${escapeHtml_(title)}</p>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${detailColor};">${escapeHtml_(detail)}</p>
      </td>
    </tr>
  </table>`;
}

function escapeHtml_(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
