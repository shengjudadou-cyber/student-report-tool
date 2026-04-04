// ============================================================
// メール送信
// ============================================================

/**
 * HTMLメールを送信する
 * @param {string} to - 送信先メールアドレス
 * @param {string} subject - 件名
 * @param {string} htmlBody - HTML本文
 * @param {string} senderName - 送信者名
 */
function sendEmail(to, subject, htmlBody, senderName) {
  GmailApp.sendEmail(to, subject, "", {
    htmlBody: htmlBody,
    name: senderName,
  });
}
