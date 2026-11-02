import "server-only";
import { z } from "zod";

// .env.example のように空文字で置かれた任意項目は「未設定」として扱う
const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.url().optional()
);

const storageConfigSchema = z.object({
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  // SES 用の AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY とは別の IAM ユーザーを使うため、
  // SDK の自動読み込みには任せず、明示的に渡す
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  // 画面に表示する画像の URL の先頭部分(末尾の / は無し)。表示用 URL は `${S3_PUBLIC_BASE_URL}/${key}`
  S3_PUBLIC_BASE_URL: z.url(),
  // 開発のみ(S3Mock)。サーバーから S3 を操作するときの接続先。本番は未設定で S3 の既定の接続先を使う
  S3_ENDPOINT: optionalUrl,
  // 開発のみ。ブラウザに渡す署名付き URL の接続先。
  // コンテナ内(S3_ENDPOINT=http://s3mock:9090)とブラウザ(http://localhost:9090)で
  // 届く名前が違うため分けている。未設定なら S3_ENDPOINT と同じにする
  S3_PUBLIC_ENDPOINT: optionalUrl,
});

export type StorageConfig = z.infer<typeof storageConfigSchema>;

/**
 * 環境変数を検証してストレージ設定を返す。
 * 設定漏れのまま「画像だけ保存できない」状態で動き続けるのを防ぐため、不備があれば即座にthrowする。
 */
export function loadStorageConfig(env: NodeJS.ProcessEnv = process.env): StorageConfig {
  const parsed = storageConfigSchema.safeParse(env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`画像ストレージの環境変数が不正です: ${fields}`);
  }
  return parsed.data;
}
