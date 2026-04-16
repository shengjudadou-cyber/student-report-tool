// ============================================================
// 設定（ここだけ書き換えてください）
// ============================================================

const CONFIG = {
  // スプレッドシートのURL内の /d/XXXXX/edit の XXXXX 部分
  SPREADSHEET_ID: "ここにスプレッドシートIDを貼り付ける",

  // データが入っているシート名
  SHEET_NAME: "授業評価",

  // 先生名（AIコメント生成とメール表示に使用）
  TEACHER_NAME: "生駒 先生",

  // メールの件名
  EMAIL_SUBJECT: "【授業フィードバックレポート】あなたの振り返りへのフィードバックをお届けします",

  // 送信者名（Gmailの送信者名として表示される）
  SENDER_NAME: "授業フィードバックシステム",

  // 1回の実行で処理する最大人数
  // GASの実行制限（6分）と Gemini 無料枠（5RPM）から計算:
  //   12秒/人 × 最大5人 = 60秒待機 + 処理時間 → 安全に6分以内に収まる
  // 未処理の生徒は次のトリガー実行で処理される（毎日連続実行でOK）
  BATCH_SIZE: 5,

  // Gemini APIの無料枠（5RPM）対応: 各生徒の処理間隔（ミリ秒）
  API_INTERVAL_MS: 12000,
};

// ============================================================
// メイン処理（時間ドリブントリガー or 手動実行から呼ばれる）
// ============================================================

/**
 * 未送信の生徒を最大 BATCH_SIZE 人分処理してレポートを送信する。
 *
 * 【二重送信の防止設計】
 *   送信前に「処理中」フラグ（"P"）をシートに書き込み、
 *   メール送信後に「送信済み」フラグ（"Y"）に更新する。
 *   途中でスクリプトが中断した場合でも "P" の行は再実行時にスキップされる。
 *   ※ 手動で "P" → 空白 に戻せば再送可能。
 *
 * 【タイムアウト対策】
 *   1実行で最大 BATCH_SIZE 人のみ処理する（デフォルト5人）。
 *   残りの生徒は次のトリガー実行（翌朝7時）で処理される。
 */
function sendReports() {
  const students = getStudentData(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_NAME);

  if (students.length === 0) {
    Logger.log("送信対象の生徒が見つかりませんでした（未送信かつ振り返り記入済みの行がありません）");
    return;
  }

  // このバッチで処理する件数（上限 BATCH_SIZE）
  const batch = students.slice(0, CONFIG.BATCH_SIZE);
  Logger.log(`送信対象: ${students.length} 名 → 今回処理: ${batch.length} 名（残り ${students.length - batch.length} 名は次回）`);

  let successCount = 0;
  let errorCount = 0;

  batch.forEach((student, index) => {
    // 2人目以降はAPI呼び出し前に待機（レート制限対策）
    if (index > 0) {
      Logger.log(`レート制限対策: ${CONFIG.API_INTERVAL_MS / 1000}秒待機中...`);
      Utilities.sleep(CONFIG.API_INTERVAL_MS);
    }

    try {
      // 1. 処理中フラグを立てる（ここから先でクラッシュしても再送しない）
      markAsProcessing(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_NAME, student.rowNumber);

      // 2. AIで振り返りを評価・フィードバック生成
      Logger.log(`[${index + 1}/${batch.length}] AI評価中: ${student.name}`);
      const ai = evaluateReflection(student.name, student.reflection, CONFIG.TEACHER_NAME);

      // 3. HTMLレポート生成
      const html = generateReportHtml(student, ai, CONFIG.TEACHER_NAME);

      // 4. メール送信
      sendEmail(student.email, CONFIG.EMAIL_SUBJECT, html, CONFIG.SENDER_NAME);

      // 5. 送信済みフラグに更新（"P" → "Y"）
      markAsSent(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_NAME, student.rowNumber);

      Logger.log(`✓ 送信完了: ${student.name} <${student.email}> → グレード ${ai.grade}`);
      successCount++;
    } catch (e) {
      Logger.log(`✗ 送信失敗: ${student.name} - ${e.message}`);
      // 処理中フラグ（"P"）はそのまま残す → 次回実行でもスキップされる
      // 手動で "P" → 空白 に戻せば再送可能
      errorCount++;
    }
  });

  Logger.log(`===== 完了: 成功 ${successCount} 件 / 失敗 ${errorCount} 件 =====`);

  // 次のバッチが残っている場合はログで通知
  if (students.length > CONFIG.BATCH_SIZE) {
    Logger.log(`⚠ 残り ${students.length - CONFIG.BATCH_SIZE} 名は次回のトリガー実行で処理されます`);
  }
}

// ============================================================
// テスト送信（1人目のデータを自分のGmailに送信して確認する）
// ============================================================

/**
 * 動作確認用：1人目の生徒のレポートを自分のメールアドレスに送信する
 * スプレッドシートの送信済みフラグは更新しない
 */
function sendTestReport() {
  const students = getStudentData(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_NAME);

  if (students.length === 0) {
    Logger.log("テスト対象の生徒が見つかりませんでした");
    return;
  }

  const student = students[0];
  Logger.log(`テスト対象: ${student.name}`);

  const ai = evaluateReflection(student.name, student.reflection, CONFIG.TEACHER_NAME);
  Logger.log(`AI評価結果: グレード ${ai.grade}（${ai.gradeLabel}）`);

  const html = generateReportHtml(student, ai, CONFIG.TEACHER_NAME);

  const myEmail = Session.getActiveUser().getEmail();
  sendEmail(myEmail, `[テスト] ${CONFIG.EMAIL_SUBJECT}`, html, CONFIG.SENDER_NAME);

  Logger.log(`テスト送信完了 → ${myEmail}（対象生徒: ${student.name}、グレード: ${ai.grade}）`);
}

// ============================================================
// 時間ドリブントリガーの設定（一度だけ実行してください）
// ============================================================

/**
 * 毎日 翌朝7時に sendReports() を実行するトリガーを登録する
 * GASエディタから一度だけ手動実行してください
 * （実行後はトリガー一覧から確認できます）
 */
function registerDailyTrigger() {
  // 既存のsendReportsトリガーを削除（重複防止）
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === "sendReports")
    .forEach((t) => ScriptApp.deleteTrigger(t));

  // 毎日 7:00〜8:00 に実行するトリガーを登録
  ScriptApp.newTrigger("sendReports")
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  Logger.log("トリガーを登録しました: 毎日 7:00〜8:00 に sendReports() が実行されます");
}
