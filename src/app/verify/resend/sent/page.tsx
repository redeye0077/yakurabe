import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthStatusLayout } from "@/components/auth/auth-status-layout";
import { authSubmitClass } from "@/components/auth/auth-styles";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 再送の受付完了画面。アカウントの有無・認証状態を推測されないよう、
// どの場合も同じ内容を表示する(入力したメールアドレスも表示しない)
export default function VerifyResendSentPage() {
  return (
    <AuthStatusLayout
      icon={MailCheck}
      title="再送を受け付けました"
      description="該当するアカウントがあれば、確認メールを送信しました。届かない場合は迷惑メールフォルダを確認するか、しばらく時間をおいてから再度お試しください。"
    >
      <Link href="/login" className={cn(buttonVariants(), authSubmitClass)}>
        ログインへ
      </Link>
    </AuthStatusLayout>
  );
}
