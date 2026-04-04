// ============================================================
// 設定（ここだけ書き換えてください）
// ============================================================

const CONFIG = {
  // スプレッドシートのURL内の /d/XXXXX/edit の XXXXX 部分
  SPREADSHEET_ID: "ここにスプレッドシートIDを貼り付ける",

  // データが入っているシート名
  SHEET_NAME: "授業評価",

  // メールの件名
  EMAIL_SUBJECT: "【授業評価レポート】あなたの受講結果をお届けします",

  // 送信者名（Gmailの送信者名として表示される）
  SENDER_NAME: "授業評価システム",
};

// ============================================================
// メイン処理（手動実行 or トリガーから呼ばれる）
// ============================================================

function sendReports() {
  const students = getStudentData(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_NAME);

  if (students.length === 0) {
    Logger.log("データが見つかりませんでした");
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  students.forEach((student) => {
    try {
      const html = generateReportHtml(student);
      sendEmail(student.email, CONFIG.EMAIL_SUBJECT, html, CONFIG.SENDER_NAME);
      Logger.log(`送信完了: ${student.name} <${student.email}>`);
      successCount++;
    } catch (e) {
      Logger.log(`送信失敗: ${student.name} - ${e.message}`);
      errorCount++;
    }
  });

  Logger.log(`完了: 成功 ${successCount} 件 / 失敗 ${errorCount} 件`);
}

// ============================================================
// 動作確認用（1人だけテスト送信する）
// ============================================================

function sendTestReport() {
  const students = getStudentData(CONFIG.SPREADSHEET_ID, CONFIG.SHEET_NAME);

  if (students.length === 0) {
    Logger.log("データが見つかりませんでした");
    return;
  }

  // 最初の1人だけ送信
  const student = students[0];
  const html = generateReportHtml(student);

  // 自分のGmailに送信（テスト用）
  const myEmail = Session.getActiveUser().getEmail();
  sendEmail(myEmail, `[テスト] ${CONFIG.EMAIL_SUBJECT}`, html, CONFIG.SENDER_NAME);
  Logger.log(`テスト送信完了: ${myEmail} に送りました（対象: ${student.name}）`);
}
