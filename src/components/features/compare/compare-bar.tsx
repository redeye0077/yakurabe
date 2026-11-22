"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildSettingCompareHref } from "@/schemas/setting-compare-query";
import { MAX_COMPARE_SETTINGS, useSettingCompareStore } from "@/stores/setting-compare-store";

/**
 * バーの高さ。スマホ(sm 未満)は選んだタイトルの段と操作の段の2段、sm 以上は1段にする。
 * バー本体と、一覧の下に取る余白の両方でこの値を使う。中身を変えて高さが変わる場合はここを直す。
 * iPhone の画面下端(ホームインジケーター)の分は、バーの padding と余白の両方に env(safe-area-inset-bottom) で足す
 */
const BAR_CONTENT_HEIGHT = "h-[112px] sm:h-[64px]";
const BAR_SPACER_HEIGHT =
  "h-[calc(112px+env(safe-area-inset-bottom))] sm:h-[calc(64px+env(safe-area-inset-bottom))]";

const compareLinkClassName =
  "inline-flex h-9 shrink-0 items-center rounded-[9px] bg-brand-brass px-5 text-[14px] font-bold text-brand-green";

/**
 * 一覧ページの下部に固定する、比較するセッティングのバー。1件以上選んだときだけ表示する。
 * 表示中は、最後のカードとページネーションがバーに隠れないよう、バーと同じ高さの余白を置き場所(一覧の末尾)に入れる。
 * z-index は、スマホメニュー(Sheet。オーバーレイと本体が z-50)より下の z-40 にして、メニューを開いたときにバーが上に出ないようにする
 */
export function CompareBar() {
  const selected = useSettingCompareStore((state) => state.selected);
  const remove = useSettingCompareStore((state) => state.remove);
  const clear = useSettingCompareStore((state) => state.clear);

  if (selected.length === 0) {
    return null;
  }

  const [first, second] = selected;
  const canCompare = selected.length === MAX_COMPARE_SETTINGS && second !== undefined;

  return (
    <>
      <div aria-hidden="true" data-compare-bar-spacer="" className={BAR_SPACER_HEIGHT} />
      <div
        role="region"
        aria-label="比較するセッティング"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-cream/10 bg-brand-green pb-[env(safe-area-inset-bottom)] text-brand-cream"
      >
        <div
          className={cn(
            BAR_CONTENT_HEIGHT,
            "flex flex-col justify-center gap-2.5 px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 md:px-12",
          )}
        >
          <ul className="flex min-w-0 gap-3 sm:flex-1">
            {selected.map((item, index) => (
              <li key={item.id} className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] sm:max-w-[320px]">
                <span className="shrink-0 font-bold text-brand-brass">{index === 0 ? "A" : "B"}:</span>
                <span className="min-w-0 truncate" title={item.title}>
                  {item.title}
                </span>
                <button
                  type="button"
                  aria-label={`${item.title}を比較から外す`}
                  onClick={() => remove(item.id)}
                  className="shrink-0 rounded-[6px] p-1 text-brand-cream/70 transition-colors hover:text-brand-cream"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
            <button
              type="button"
              onClick={clear}
              className="text-[13px] text-brand-cream/70 underline-offset-4 transition-colors hover:text-brand-cream hover:underline"
            >
              すべて解除
            </button>
            <div className="flex items-center gap-3">
              {!canCompare && <span className="text-[12px] text-brand-cream/70">もう1件選んでください</span>}
              {canCompare ? (
                <Link
                  href={buildSettingCompareHref([first.id, second.id])}
                  className={cn(compareLinkClassName, "transition-opacity hover:opacity-90")}
                >
                  比べる
                </Link>
              ) : (
                // 1件のときは遷移先が無いため Link にせず、押せない見た目のリンクとして置く
                <span role="link" aria-disabled="true" className={cn(compareLinkClassName, "cursor-not-allowed opacity-50")}>
                  比べる
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
