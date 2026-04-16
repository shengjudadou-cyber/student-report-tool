// ============================================================
// スプレッドシートの読み書き
//
// 想定するシートの列構成（1行目はヘッダー）:
//   A: 氏名
//   B: メールアドレス
//   C: 振り返り文
//   D: 送信済み  ← 処理フラグ管理に使用
//
// 送信済み列の値の意味:
//   空白 … 未処理（送信対象）
//   "P"  … 処理中（GASが現在処理中、または前回エラーで中断）
//            ※ 手動で空白に戻すと再送対象になる
//   "Y"  … 送信完了（スキップ対象）
// ============================================================

/**
 * 未送信（送信済み列が空白）の生徒データを取得する
 * "P"（処理中）と "Y"（送信済み）はスキップする
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
      name:       String(row[col("氏名")]).trim(),
      email:      String(row[col("メールアドレス")]).trim(),
      reflection: String(row[col("振り返り文")]).trim(),
      sent:       String(row[col("送信済み")]).trim(),
    }))
    // 空白のみ対象（"P"=処理中・"Y"=送信済み はスキップ）
    .filter((s) => s.email && s.reflection && s.sent === "");
}

/**
 * 処理中フラグ "P" をセットする
 * メール送信前に呼び出すことで、処理中に中断しても再送を防ぐ
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @param {number} rowNumber
 */
function markAsProcessing(spreadsheetId, sheetName, rowNumber) {
  setSentFlag_(spreadsheetId, sheetName, rowNumber, "P");
}

/**
 * 送信完了フラグ "Y" をセットする
 * @param {string} spreadsheetId
 * @param {string} sheetName
 * @param {number} rowNumber
 */
function markAsSent(spreadsheetId, sheetName, rowNumber) {
  setSentFlag_(spreadsheetId, sheetName, rowNumber, "Y");
}

function setSentFlag_(spreadsheetId, sheetName, rowNumber, value) {
  const sheet = getSheet_(spreadsheetId, sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const sentCol = headers.indexOf("送信済み") + 1;

  if (sentCol === 0) throw new Error("列「送信済み」がシートに見つかりません");
  sheet.getRange(rowNumber, sentCol).setValue(value);
}

function getSheet_(spreadsheetId, sheetName) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`シート「${sheetName}」が見つかりません`);
  return sheet;
}
