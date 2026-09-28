import "server-only";
import { z } from "zod";

const appConfigSchema = z.object({
  // メール内リンクなど、アプリの外に出すURLのベース。
  // リクエストのHostヘッダーは偽装できるため使わず、環境変数で固定する
  APP_URL: z.url({ protocol: /^https?$/ }),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

/**
 * 環境変数を検証してアプリ設定を返す。
 * 不備があれば即座にthrowする(メール設定と同様、初回利用時に検知する)。
 */
export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = appConfigSchema.safeParse(env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`アプリ設定の環境変数が不正です: ${fields}`);
  }
  return parsed.data;
}
