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
};

// ============================================================
// メイン処理（時間ドリブントリガー or 手動実行から呼ばれる）
// ============================================================

/**
 * 全生徒分のレポートを送信する
 * 送信済みフラグ（"Y"）が立っている生徒はスキップするため
 * 誤って複数回実行しても二重送信されない
 */
function sendReports() {
  const students = getStudentData(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_NAME);

  if (students.length === 0) {
    Logger.log("送信対象の生徒が見つかりませんでした（未送信かつ振り返り記入済みの行がありません）");
    return;
  }

  Logger.log(`送信対象: ${students.length} 名`);

  let successCount = 0;
  let errorCount = 0;

  // Gemini APIの無料枠は5RPM（分間5リクエスト）
  // 1人あたり最低12秒間隔を空けることで安全に処理する
  const API_INTERVAL_MS = 12000;

  students.forEach((student, index) => {
    // 2人目以降はAPI呼び出し前に待機（レート制限対策）
    if (index > 0) {
      Logger.log(`レート制限対策: ${API_INTERVAL_MS / 1000}秒待機中...`);
      Utilities.sleep(API_INTERVAL_MS);
    }

    try {
      // 1. AIで振り返りを評価・フィードバック生成
      Logger.log(`[${index + 1}/${students.length}] AI評価中: ${student.name}`);
      const ai = evaluateReflection(student.name, student.reflection, CONFIG.TEACHER_NAME);

      // 2. HTMLレポート生成
      const html = generateReportHtml(student, ai, CONFIG.TEACHER_NAME);

      // 3. メール送信
      sendEmail(student.email, CONFIG.EMAIL_SUBJECT, html, CONFIG.SENDER_NAME);

      // 4. 送信済みフラグをセット（二重送信防止）
      markAsSent(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_NAME, student.rowNumber);

      Logger.log(`✓ 送信完了: ${student.name} <${student.email}> → グレード ${ai.grade}`);
      successCount++;
    } catch (e) {
      Logger.log(`✗ 送信失敗: ${student.name} - ${e.message}`);
      errorCount++;
    }
  });

  Logger.log(`===== 完了: 成功 ${successCount} 件 / 失敗 ${errorCount} 件 =====`);
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
