import { Star } from "lucide-react";

export function BeginnerBanner() {
  return (
    <section className="px-6 py-8 md:px-12">
      <div className="flex items-center gap-4 rounded-[12px] border border-brand-border bg-white px-[26px] py-[22px]">
        <Star
          className="size-[26px] shrink-0 text-brand-brass"
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <div className="flex flex-col gap-1">
          <h2 className="text-[15px] font-bold text-brand-ink">初心者の方へ</h2>
          <p className="text-[13.5px] text-brand-muted">
            どんなセッティングを選べばいいか迷ったら、まずは初心者向けのセッティングを参考にしてみましょう。
          </p>
        </div>
      </div>
    </section>
  );
}
