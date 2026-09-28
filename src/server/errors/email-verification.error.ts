// トークンが存在しない、または既に使用済みの場合
export class InvalidVerificationTokenError extends Error {
  constructor(message = "認証リンクが無効です") {
    super(message);
    this.name = "InvalidVerificationTokenError";
  }
}

// トークンの有効期限が切れている場合(再送を促す)
export class ExpiredVerificationTokenError extends Error {
  constructor(message = "認証リンクの有効期限が切れています") {
    super(message);
    this.name = "ExpiredVerificationTokenError";
  }
}
