"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_COMPARE_SETTINGS, useSettingCompareStore } from "@/stores/setting-compare-store";

type CompareToggleButtonProps = {
  settingId: string;
  title: string;
};

// 一覧のカードに置く比較ボタン。押すと比較するセッティングに追加し、もう一度押すと外す
export function CompareToggleButton({ settingId, title }: CompareToggleButtonProps) {
  const isSelected = useSettingCompareStore((state) => state.selected.some((item) => item.id === settingId));
  const isFull = useSettingCompareStore((state) => state.selected.length >= MAX_COMPARE_SETTINGS);
  const toggle = useSettingCompareStore((state) => state.toggle);

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      // 2件選んだら、未選択のカードは押せなくする。選択中のカードは外せるよう押せるままにする
      disabled={!isSelected && isFull}
      onClick={() => toggle({ id: settingId, title })}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        isSelected && "border-brand-brass bg-brand-brass text-brand-green hover:bg-brand-brass/90",
      )}
    >
      {isSelected ? "比較から外す" : "比較に追加"}
    </button>
  );
}
