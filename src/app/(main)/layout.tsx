import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/common/site-header";

// ヘッダー付きページ共通のレイアウト(ログイン・登録画面はこのグループに含めない)
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      <SiteHeader isLoggedIn={!!session?.user} />
      <main className="flex-1 bg-brand-ivory">{children}</main>
    </>
  );
}
