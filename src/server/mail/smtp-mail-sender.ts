import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type { MailMessage, MailSender } from "@/server/mail/mail-sender";

type SmtpMailSenderOptions = {
  host: string;
  port: number;
  from: string;
};

/**
 * SMTP送信の実装。開発環境ではMailpitに向けて使う。
 * Mailpitは認証・TLS不要なので、その前提の最小構成にしている。
 */
export class SmtpMailSender implements MailSender {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor({ host, port, from }: SmtpMailSenderOptions) {
    this.transporter = nodemailer.createTransport({ host, port, secure: false });
    this.from = from;
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}
