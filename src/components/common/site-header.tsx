import Link from "next/link";
import { signOut } from "@/lib/auth";
import { DartMark } from "@/components/common/dart-mark";

const navLinks = [
  { href: "/settings", label: "セッティング一覧" },
  { href: "/settings/new", label: "新規投稿" },
  { href: "/mypage", label: "マイページ" },
];

async function logout() {
  "use server";
  await signOut({ redirectTo: "/" });
}

type SiteHeaderProps = {
  isLoggedIn: boolean;
};

export function SiteHeader({ isLoggedIn }: SiteHeaderProps) {
  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between bg-brand-green px-6 md:px-12">
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-2.5">
          <DartMark className="size-[22px] text-brand-brass" />
          <span className="font-heading text-[19px] tracking-[0.04em] text-brand-cream">
            矢比べ
          </span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-brand-cream/70 transition-colors hover:text-brand-cream"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-5">
        {isLoggedIn ? (
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-brand-cream/70 transition-colors hover:text-brand-cream"
            >
              ログアウト
            </button>
          </form>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm text-brand-cream/70 transition-colors hover:text-brand-cream"
            >
              ログイン
            </Link>
            <Link
              href="/register"
              className="rounded-[8px] bg-brand-brass px-4 py-2 text-sm font-bold text-brand-green transition-opacity hover:opacity-90"
            >
              新規登録
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
