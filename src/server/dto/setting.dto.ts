import type { SettingLevel } from "@/schemas/setting-level";
import type { SettingDiff } from "@/lib/setting-compare";

// 一覧・トップの新着で表示するセッティング
export type SettingListItemDto = {
  id: string;
  title: string;
  level: SettingLevel | null; // 対象レベル。未設定なら null で、画面ではバッジを表示しない
  imageUrl: string | null; // 表示用 URL(Service で保存先キーから組み立てる)。未設定なら画面側で DartMark を表示する
  barrelName: string;
  shaftName: string | null; // シャフト一体型フライトの場合は null
  flightName: string;
  tipName: string;
  barrelWeight: number; // g。重量はバレル重量を指す(保存せず商品から取得する)
  totalPrice: number; // 円。保存せず取得時に計算する
  userName: string;
  createdAt: string; // ISO文字列
};

// /settings の1ページ分。page は Service で 1〜totalPages に補正した値。0件のとき totalPages は 1
export type SettingListPageDto = {
  items: SettingListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// 比較ページで表示するパーツ。同じ/違うの判定に使うため id を含める
export type SettingComparePartDto = {
  id: string;
  name: string;
  price: number; // 円
};

// 比較ページで表示するセッティング1件
export type SettingCompareItemDto = {
  id: string;
  title: string;
  level: SettingLevel | null; // 未設定なら null
  imageUrl: string | null; // 表示用 URL。未設定なら画面側で DartMark を表示する
  barrel: SettingComparePartDto & { weight: number }; // weight は g。重量はバレル重量を指す
  shaft: SettingComparePartDto | null; // シャフト一体型フライトの場合は null
  flight: SettingComparePartDto;
  tip: SettingComparePartDto;
  totalPrice: number; // 円。保存せず取得時に計算する
  userName: string;
  createdAt: string; // ISO文字列
};

// 比較ページの表示内容。settings は URL の ids と同じ順(A, B)。diff は B − A
export type SettingCompareDto = {
  settings: [SettingCompareItemDto, SettingCompareItemDto];
  diff: SettingDiff;
};

// 編集フォームの初期値。投稿者は Service で確認済みのため含めない
export type SettingEditDto = {
  title: string;
  description: string | null;
  level: SettingLevel | null; // 未設定なら null
  imageUrl: string | null; // 表示用 URL。未設定なら null
  barrelId: string;
  shaftId: string | null; // シャフト一体型フライトの場合は null
  flightId: string;
  tipId: string;
};

// 画像のアップロード先。画面は url に fields と file を multipart/form-data で POST し、
// 成功したら key をフォームの imageKey として送る
export type SettingImageUploadDto = {
  url: string;
  fields: Record<string, string>;
  key: string;
};
