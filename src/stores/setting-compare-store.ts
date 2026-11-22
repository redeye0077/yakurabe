import { create } from "zustand";

// 一度に比べられるセッティングの件数
export const MAX_COMPARE_SETTINGS = 2;

export type CompareSettingItem = {
  id: string;
  // CompareBar にタイトルを表示するため、id と一緒に持つ
  title: string;
};

type SettingCompareState = {
  // 選んだ順に並べる。比較ページでは先に選んだ方を A、後に選んだ方を B にする
  selected: CompareSettingItem[];
  // 選択中なら外し、未選択なら追加する。すでに2件選んでいるときの追加は何もしない
  toggle: (item: CompareSettingItem) => void;
  remove: (id: string) => void;
  clear: () => void;
};

/**
 * 一覧のカードの比較ボタンと CompareBar で、比較するセッティングの選択を共有する。
 * ページネーションで移動しても選択を残すため、コンポーネントの state ではなく store に持つ。
 * persist はしない(リロードすると選択は消える)。
 *
 * store はモジュールに1つだけ作る。Next.js ではサーバー側のモジュールがリクエストをまたいで共有されるが、
 * 状態を変えるのはクライアントのクリック操作(toggle / remove / clear)だけで、サーバー側のレンダリングでは
 * 状態を変えない(常に初期状態の空のまま読む)ため、ほかの利用者の選択が混ざることはない。
 * サーバー側で状態を変える処理を足す場合は、リクエストごとに store を作る形に変えること
 */
export const useSettingCompareStore = create<SettingCompareState>()((set) => ({
  selected: [],
  toggle: (item) =>
    set((state) => {
      if (state.selected.some((selected) => selected.id === item.id)) {
        return { selected: state.selected.filter((selected) => selected.id !== item.id) };
      }
      if (state.selected.length >= MAX_COMPARE_SETTINGS) {
        return state;
      }
      return { selected: [...state.selected, item] };
    }),
  remove: (id) => set((state) => ({ selected: state.selected.filter((selected) => selected.id !== id) })),
  clear: () => set({ selected: [] }),
}));
