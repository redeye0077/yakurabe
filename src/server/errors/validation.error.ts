// 入力値がビジネスルールに反している場合
export class ValidationError extends Error {
  constructor(message = "入力内容が正しくありません") {
    super(message);
    this.name = "ValidationError";
  }
}
