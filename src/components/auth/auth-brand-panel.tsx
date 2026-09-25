// ログイン・登録画面で共通のブランド要素(左パネル・モバイル用ロゴ)
import { DartMark } from "@/components/common/dart-mark";

// lg以上で表示する左側のブランドパネル
export function AuthBrandPanel() {
  return (
    <aside className="hidden w-[480px] shrink-0 flex-col justify-between bg-brand-green px-12 py-14 text-brand-cream lg:flex">
      <div className="flex items-center gap-2.5">
        <DartMark className="size-[26px] text-brand-brass" />
        <span className="font-heading text-xl tracking-[0.04em]">矢比べ</span>
      </div>

      <div className="flex flex-col gap-5">
        <p className="font-heading text-[28px] leading-[1.6] font-medium">
          自分だけのセッティングを、
          <br />
          もっと自由に比べよう。
        </p>
        <p className="max-w-[320px] text-sm leading-[1.9] text-brand-cream/60">
          バレル・シャフト・フライトの組み合わせを記録し、他のプレイヤーと共有できるダーツセッティング共有アプリ。
        </p>
      </div>

      <span className="text-xs tracking-[0.03em] text-brand-cream/40">
        © 2026 Yakurabe
      </span>
    </aside>
  );
}

// lg未満(左パネルが消えるサイズ)でフォーム上部に出すロゴ
export function AuthMobileLogo() {
  return (
    <div className="flex items-center justify-center gap-2 lg:hidden">
      <DartMark className="size-6 text-brand-brass" />
      <span className="font-heading text-lg tracking-[0.04em] text-brand-green">
        矢比べ
      </span>
    </div>
  );
}
