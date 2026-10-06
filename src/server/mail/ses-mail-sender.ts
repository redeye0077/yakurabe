import "server-only";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { MailMessage, MailSender } from "@/server/mail/mail-sender";

type SesMailSenderOptions = {
  region: string;
  from: string;
};

/**
 * AWS SES(v2 API)での送信実装。本番環境用。
 * 認証情報はSES送信専用IAMユーザーのアクセスキーを
 * AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY 環境変数で渡し、SDKに自動で読み込ませる。
 */
export class SesMailSender implements MailSender {
  private readonly client: SESv2Client;
  private readonly from: string;

  constructor({ region, from }: SesMailSenderOptions) {
    this.client = new SESv2Client({ region });
    this.from = from;
  }

  async send(message: MailMessage): Promise<void> {
    await this.client.send(
      new SendEmailCommand({
        FromEmailAddress: this.from,
        Destination: { ToAddresses: [message.to] },
        Content: {
          Simple: {
            Subject: { Data: message.subject, Charset: "UTF-8" },
            Body: {
              Text: { Data: message.text, Charset: "UTF-8" },
              ...(message.html && {
                Html: { Data: message.html, Charset: "UTF-8" },
              }),
            },
          },
        },
      })
    );
  }
}
