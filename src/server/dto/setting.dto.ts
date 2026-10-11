// 一覧・新着表示用のセッティング概要
export type SettingSummary = {
  id: string;
  title: string;
  userName: string;
  barrelWeight: number; // g。重量はバレル重量を指す(保存せず商品から取得する)
  imageUrl: string | null;
};
