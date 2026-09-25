import Link from "next/link";
import { HeroDartboard } from "@/components/features/top/hero-dartboard";

type HeroSectionProps = {
  isLoggedIn: boolean;
};

export function HeroSection({ isLoggedIn }: HeroSectionProps) {
  return (
    <section className="flex flex-col items-center gap-10 bg-brand-green px-6 py-12 md:flex-row md:justify-between md:px-12 md:py-[72px]">
      <div className="flex w-full max-w-[480px] flex-col gap-6">
        <h1 className="font-heading text-[28px] leading-[1.55] font-semibold text-brand-cream md:text-[32px]">
          自分に合ったセッティングで、
          <br />
          もっとダーツが楽しくなる
        </h1>
        <p className="text-[15px] leading-[1.9] text-brand-cream/65">
          みんなのセッティングを参考にして、あなたにピッタリの組み合わせを見つけよう。
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/settings"
            className="rounded-[9px] bg-brand-brass px-6 py-3 text-[14.5px] font-bold text-brand-green transition-opacity hover:opacity-90"
          >
            セッティングを探す
          </Link>
          {!isLoggedIn && (
            <Link
              href="/register"
              className="rounded-[9px] border border-brand-cream/35 px-6 py-3 text-[14.5px] text-brand-cream transition-colors hover:bg-brand-cream/10"
            >
              新規登録する
            </Link>
          )}
        </div>
      </div>

      <HeroDartboard className="hidden w-full max-w-[440px] md:block" />
    </section>
  );
}
