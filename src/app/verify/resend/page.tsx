import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthStatusLayout } from "@/components/auth/auth-status-layout";
import { authLinkClass } from "@/components/auth/auth-styles";
import { ResendForm } from "@/app/verify/resend/resend-form";

export default function VerifyResendPage() {
  return (
    <AuthStatusLayout
      icon={Mail}
      title="確認メールの再送"
      description="登録したメールアドレスを入力してください。確認が済んでいないアカウントに、新しい確認メールを送信します。以前のメールのリンクは使えなくなります。"
    >
      <ResendForm />
      <p className="text-center text-[13.5px] text-brand-muted">
        確認が済んでいる場合は{" "}
        <Link href="/login" className={authLinkClass}>
          ログイン
        </Link>
      </p>
    </AuthStatusLayout>
  );
}
