import "server-only";
import { loadMailConfig } from "@/server/mail/mail-config";
import type { MailSender } from "@/server/mail/mail-sender";
import { SesMailSender } from "@/server/mail/ses-mail-sender";
import { SmtpMailSender } from "@/server/mail/smtp-mail-sender";

let instance: MailSender | null = null;

/**
 * MAIL_DRIVER に応じたMailSenderを返す。
 * SMTPコネクションやSESクライアントを使い回すためシングルトンにしている。
 * 環境変数の検証はimport時ではなく初回呼び出し時に行うので、ビルドやテストには影響しない。
 */
export function getMailSender(): MailSender {
  if (instance) return instance;

  const config = loadMailConfig();
  instance =
    config.MAIL_DRIVER === "smtp"
      ? new SmtpMailSender({
          host: config.SMTP_HOST,
          port: config.SMTP_PORT,
          from: config.MAIL_FROM,
        })
      : new SesMailSender({
          region: config.AWS_REGION,
          from: config.MAIL_FROM,
        });

  return instance;
}

/** テスト用。環境変数を変えて getMailSender の結果を確認するためにキャッシュを破棄する */
export function resetMailSenderForTest(): void {
  instance = null;
}
