// ページを丸ごと読み込み直して遷移する(Next.jsのルーターキャッシュを使わない)。
// jsdom では window.location.assign を差し替えられないため、テストではこのモジュールをモックする
export function hardNavigate(url: string) {
  window.location.assign(url);
}
