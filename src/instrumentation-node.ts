import { loadAppConfig } from "@/server/config/app-config";
import { loadMailConfig } from "@/server/mail/mail-config";

/**
 * APP_URL・メール設定の漏れを起動時に検知し、サーバーを起動させない。
 * 登録時のメール送信失敗は握りつぶして登録成功扱いにしているため、
 * 設定ミスをリクエスト時まで持ち越すと「登録はできるがメールが届かない」状態に気づけない。
 *
 * instrumentation でthrowするだけだと Next.js はエラーを出力してプロセスが生き残る
 * (リクエストを受けられないまま起動中に見える)ので、明示的に終了させる。
 */
try {
  loadAppConfig();
  loadMailConfig();
} catch (error) {
  console.error("[startup] 環境変数の設定に不備があるため起動を中止します", error);
  process.exit(1);
}
