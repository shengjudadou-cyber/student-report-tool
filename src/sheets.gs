// ============================================================
// スプレッドシートからデータを取得する
// ============================================================

/**
 * スプレッドシートから生徒データを取得する
 * @returns {Array} 生徒データの配列
 */
function getStudentData(spreadsheetId, sheetName) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`シート「${sheetName}」が見つかりません`);
  }

  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    return []; // ヘッダー行しかない場合
  }

  // 1行目はヘッダー、2行目以降がデータ
  const headers = data[0];
  const rows = data.slice(1);

  // 列インデックスをヘッダー名で取得
  const col = (name) => headers.indexOf(name);

  return rows
    .filter((row) => row[col("メールアドレス")] !== "") // メールなし行はスキップ
    .map((row) => ({
      name: row[col("氏名")],
      email: row[col("メールアドレス")],
      courseName: row[col("授業名")],
      understanding: Number(row[col("理解度")]),   // 1〜5
      satisfaction: Number(row[col("満足度")]),    // 1〜5
      difficulty: Number(row[col("難易度")]),      // 1〜5
      comment: row[col("コメント")] || "",
    }));
}
