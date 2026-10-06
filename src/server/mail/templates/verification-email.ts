import type { MailMessage } from "@/server/mail/mail-sender";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 登録直後に送るメールアドレス確認メールの件名・本文を組み立てる */
export function buildVerificationEmail(params: {
  to: string;
  username: string;
  verificationUrl: string;
}): MailMessage {
  const { to, username, verificationUrl } = params;
  const subject = "【矢比べ】メールアドレスの確認をお願いします";

  const text = [
    `${username} さん`,
    "",
    "矢比べへのご登録ありがとうございます。",
    "以下のリンクを開いて、メールアドレスの確認を完了してください。",
    "",
    verificationUrl,
    "",
    "※このリンクの有効期限は24時間です。",
    "※このメールに心当たりがない場合は、破棄してください。",
  ].join("\n");

  const safeName = escapeHtml(username);
  const safeUrl = escapeHtml(verificationUrl);
  const html = `<p>${safeName} さん</p>
<p>矢比べへのご登録ありがとうございます。<br>以下のリンクを開いて、メールアドレスの確認を完了してください。</p>
<p><a href="${safeUrl}">メールアドレスを確認する</a></p>
<p>リンクが開けない場合は、以下のURLをブラウザに貼り付けてください。<br>${safeUrl}</p>
<p>※このリンクの有効期限は24時間です。<br>※このメールに心当たりがない場合は、破棄してください。</p>`;

  return { to, subject, text, html };
}
