// 一覧・トップの新着で表示するセッティング
export type SettingListItemDto = {
  id: string;
  title: string;
  imageUrl: string | null; // 未設定なら画面側で DartMark を表示する
  barrelName: string;
  shaftName: string | null; // シャフト一体型フライトの場合は null
  flightName: string;
  tipName: string;
  barrelWeight: number; // g。重量はバレル重量を指す(保存せず商品から取得する)
  totalPrice: number; // 円。保存せず取得時に計算する
  userName: string;
  createdAt: string; // ISO文字列
};
