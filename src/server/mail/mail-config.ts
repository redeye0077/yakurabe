import "server-only";
import { z } from "zod";

const mailConfigSchema = z.discriminatedUnion("MAIL_DRIVER", [
  z.object({
    MAIL_DRIVER: z.literal("smtp"),
    MAIL_FROM: z.email(),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().int().positive(),
  }),
  z.object({
    MAIL_DRIVER: z.literal("ses"),
    MAIL_FROM: z.email(),
    AWS_REGION: z.string().min(1),
    // 認証情報(AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)はSDKが環境変数から
    // 自動で読み込むため、ここでは存在チェックのみ行い値は使わない
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
  }),
]);

export type MailConfig = z.infer<typeof mailConfigSchema>;

/**
 * 環境変数を検証してメール設定を返す。
 * 設定漏れのまま「黙って送信失敗」するのを防ぐため、不備があれば即座にthrowする。
 */
export function loadMailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig {
  const parsed = mailConfigSchema.safeParse(env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`メール送信の環境変数が不正です: ${fields}`);
  }
  return parsed.data;
}
