import Link from "next/link";
import { Clock } from "lucide-react";
import { AuthStatusLayout } from "@/components/auth/auth-status-layout";
import { authSubmitClass } from "@/components/auth/auth-styles";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function VerifyExpiredPage() {
  return (
    <AuthStatusLayout
      icon={Clock}
      title="リンクの有効期限が切れています"
      description="確認メールのリンクは24時間で無効になります。確認メールを再送してください。"
    >
      <Link href="/verify/resend" className={cn(buttonVariants(), authSubmitClass)}>
        確認メールを再送する
      </Link>
    </AuthStatusLayout>
  );
}
