import Link from "next/link";
import { MailCheck } from "lucide-react";
import {
  AuthBrandPanel,
  AuthMobileLogo,
} from "@/components/auth/auth-brand-panel";
import { authLinkClass } from "@/components/auth/auth-styles";

// 登録直後の確認メール送信完了画面。
// メールアドレスはURLに載せると履歴・アクセスログに残るため表示しない
export default function RegisterSentPage() {
  return (
    <div className="flex min-h-screen bg-brand-ivory text-brand-ink">
      <AuthBrandPanel />

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="flex w-full max-w-[360px] flex-col gap-6">
          <AuthMobileLogo />

          <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
            <MailCheck className="size-10 text-brand-brass" aria-hidden />
            <h1 className="font-heading text-2xl font-semibold lg:text-[28px]">
              確認メールを送信しました
            </h1>
            <p className="text-sm leading-[1.9] text-brand-muted">
              ご登録のメールアドレス宛に確認メールを送信しました。
              メール内のリンクを開いて、登録を完了してください。
            </p>
          </div>

          <ul className="flex list-disc flex-col gap-1.5 rounded-[10px] border border-brand-border bg-white px-5 py-4 pl-8 text-[13px] leading-[1.8] text-brand-muted">
            <li>リンクの有効期限は24時間です。</li>
            <li>メールが届かない場合は、迷惑メールフォルダもご確認ください。</li>
          </ul>

          <p className="text-center text-[13.5px] text-brand-muted">
            確認が済んだら{" "}
            <Link href="/login" className={authLinkClass}>
              ログイン
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
