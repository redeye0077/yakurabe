const DEFAULT_REDIRECT = "/";

/**
 * ログイン後の遷移先を決める。middleware は callbackUrl に絶対URLを付けるため、
 * 同じオリジンの場合だけパス部分を返し、それ以外は "/" にする(外部サイトへのリダイレクトを防ぐ)。
 */
export function resolveCallbackUrl(callbackUrl: string | null, origin: string): string {
  if (!callbackUrl) {
    return DEFAULT_REDIRECT;
  }

  let url: URL;
  try {
    url = new URL(callbackUrl, origin);
  } catch {
    return DEFAULT_REDIRECT;
  }

  // "//evil.com" や "/\evil.com" も解析すると別オリジンになるため、ここで弾ける
  if (url.origin !== origin) {
    return DEFAULT_REDIRECT;
  }
  // ログイン画面に戻すと、ログイン済みなのにフォームが表示されてしまう
  if (url.pathname === "/login") {
    return DEFAULT_REDIRECT;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
