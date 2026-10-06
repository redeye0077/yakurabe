// ログイン失敗時に NextAuth の signIn が返す code。サーバー/クライアント両方から参照する。
// code はリダイレクトURLのクエリにも載るため、ユーザー情報などは含めない
export const LOGIN_ERROR_CODE = {
  emailNotVerified: "email_not_verified",
} as const;
