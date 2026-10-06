import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { AuthStatusLayout } from "@/components/auth/auth-status-layout";
import { authLinkClass, authSubmitClass } from "@/components/auth/auth-styles";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// トークンが存在しない・使用済みの場合。どちらかは区別して表示しない
export default function VerifyInvalidPage() {
  return (
    <AuthStatusLayout
      icon={CircleAlert}
      title="リンクが無効です"
      description="このリンクは無効か、すでに使用されています。確認が済んでいる場合はそのままログインできます。"
    >
      <Link href="/login" className={cn(buttonVariants(), authSubmitClass)}>
        ログインへ
      </Link>
      <p className="text-center text-[13.5px] text-brand-muted">
        確認が済んでいない場合は{" "}
        <Link href="/verify/resend" className={authLinkClass}>
          確認メールを再送
        </Link>
      </p>
    </AuthStatusLayout>
  );
}
