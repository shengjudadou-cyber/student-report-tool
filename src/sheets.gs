// ============================================================
// スプレッドシートの読み書き
//
// 想定するシートの列構成（1行目はヘッダー）:
//   A: 氏名
//   B: メールアドレス
//   C: 振り返り文
//   D: 送信済み  ← 送信完了後に "Y" をセット（二重送信防止）
// ============================================================

/**
 * 未送信の生徒データを取得する
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @returns {Array<Object>} 生徒データの配列
 */
function getStudentData(spreadsheetId, sheetName) {
  const sheet = getSheet_(spreadsheetId, sheetName);
  const data = sheet.getDataRange().getValues();

  if (data.length < 2) return [];

  const headers = data[0];
  const col = (name) => headers.indexOf(name);

  // 必須列の存在チェック
  ["氏名", "メールアドレス", "振り返り文", "送信済み"].forEach((name) => {
    if (col(name) === -1) throw new Error(`列「${name}」がシートに見つかりません`);
  });

  return data
    .slice(1)
    .map((row, i) => ({
      rowNumber: i + 2, // スプレッドシートの実際の行番号（ヘッダー=1行目のため+2）
      name: row[col("氏名")],
      email: row[col("メールアドレス")],
      reflection: row[col("振り返り文")],
      sent: row[col("送信済み")],
    }))
    .filter((s) => s.email && s.reflection && s.sent !== "Y");
}

/**
 * 送信済みフラグを "Y" にセットする（二重送信防止）
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @param {number} rowNumber - スプレッドシートの行番号
 */
function markAsSent(spreadsheetId, sheetName, rowNumber) {
  const sheet = getSheet_(spreadsheetId, sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const sentCol = headers.indexOf("送信済み") + 1;

  if (sentCol === 0) throw new Error("列「送信済み」がシートに見つかりません");
  sheet.getRange(rowNumber, sentCol).setValue("Y");
}

function getSheet_(spreadsheetId, sheetName) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`シート「${sheetName}」が見つかりません`);
  return sheet;
}
