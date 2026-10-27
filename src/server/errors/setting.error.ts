// セッティングの業務ルール違反で、エラーを表示する入力項目
export type SettingRuleField = "barrelId" | "shaftId" | "flightId" | "tipId";

// 選んだ商品が存在しない、シャフトとフライトの規格が合わないなど、セッティングの組み合わせが業務ルールに反している場合
export class SettingRuleError extends Error {
  readonly field: SettingRuleField;

  constructor(field: SettingRuleField, message: string) {
    super(message);
    this.name = "SettingRuleError";
    this.field = field;
  }
}

// 対象のセッティングが存在しない、または操作しようとしたユーザーの投稿ではない場合。
// 他人の投稿の存在を知らせないよう、2つを区別しない
export class SettingNotFoundError extends Error {
  constructor(message = "セッティングが見つかりません") {
    super(message);
    this.name = "SettingNotFoundError";
  }
}
