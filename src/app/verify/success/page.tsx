import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { AuthStatusLayout } from "@/components/auth/auth-status-layout";
import { authSubmitClass } from "@/components/auth/auth-styles";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 認証成功画面。自動ログインはせず、ログイン画面へ案内する
export default function VerifySuccessPage() {
  return (
    <AuthStatusLayout
      icon={CircleCheck}
      title="メールアドレスを確認しました"
      description="登録が完了しました。ログインしてご利用ください。"
    >
      <Link href="/login" className={cn(buttonVariants(), authSubmitClass)}>
        ログインへ
      </Link>
    </AuthStatusLayout>
  );
}
