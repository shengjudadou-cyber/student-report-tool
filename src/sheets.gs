// ============================================================
// スプレッドシートの読み書き
//
// Googleフォームが自動生成するシート列構成（1行目はヘッダー）:
//   タイムスタンプ
//   メールアドレス
//   クラス
//   出席番号
//   名前
//   本日の「事前動画」を観てきましたか？...
//   理解度...
//   【最重要】本日の授業振り返り...  ← 振り返り文（前方一致で取得）
//   手書きの振り返りを写真などで送りたい場合はこちらへ...
//   送信済み  ← 手動で追加が必要。処理フラグ管理に使用
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

  const headers = data[0].map(String);

  // 完全一致で列インデックスを返す
  const col = (name) => headers.indexOf(name);

  // 前方一致で列インデックスを返す（Googleフォームの長い質問文に対応）
  const colStartsWith = (prefix) => headers.findIndex((h) => h.startsWith(prefix));

  // 必須列の存在チェック
  const checks = [
    { key: "名前",           idx: col("名前") },
    { key: "メールアドレス", idx: col("メールアドレス") },
    { key: "クラス",         idx: col("クラス") },
    { key: "出席番号",       idx: col("出席番号") },
    { key: "【最重要】本日の授業振り返り（振り返り文）", idx: colStartsWith("【最重要】") },
    { key: "送信済み",       idx: col("送信済み") },
  ];
  checks.forEach(({ key, idx }) => {
    if (idx === -1) throw new Error(`列「${key}」がシートに見つかりません。ヘッダー一覧: ${headers.join(" | ")}`);
  });

  const reflectionCol = colStartsWith("【最重要】");

  return data
    .slice(1)
    .map((row, i) => ({
      rowNumber:     i + 2,
      name:          String(row[col("名前")]).trim(),
      email:         String(row[col("メールアドレス")]).trim(),
      className:     String(row[col("クラス")]).trim(),
      studentNumber: String(row[col("出席番号")]).replace(/\.0$/, "").trim(), // 数値の末尾 ".0" を除去
      reflection:    String(row[reflectionCol]).trim(),
      sent:          String(row[col("送信済み")]).trim(),
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
