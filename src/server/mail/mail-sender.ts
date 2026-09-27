import "server-only";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * メール送信の抽象。Service層はこの型だけに依存し、
 * SMTP(開発: Mailpit) / SES(本番) のどちらで送るかは意識しない。
 */
export interface MailSender {
  send(message: MailMessage): Promise<void>;
}
