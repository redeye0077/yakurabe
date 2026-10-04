// パスワードは正しいが、メールアドレスの確認が完了していない場合
export class EmailNotVerifiedError extends Error {
  constructor(message = "メールアドレスの確認が完了していません") {
    super(message);
    this.name = "EmailNotVerifiedError";
  }
}
