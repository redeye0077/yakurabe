/**
 * サーバー起動時に一度だけ呼ばれる(Next.js の instrumentation フック)。
 * Node.js ランタイムでのみ、起動時チェック(instrumentation-node.ts)を実行する。
 * Edge 用バンドルに Node.js 専用のコードが入らないよう、動的 import で分けている。
 * next build や vitest からは呼ばれないので、ビルド・テストには影響しない。
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
