import { redirect } from "next/navigation";
import { MailCheck } from "lucide-react";
import { AuthStatusLayout } from "@/components/auth/auth-status-layout";
import { authSubmitClass } from "@/components/auth/auth-styles";
import { Button } from "@/components/ui/button";
import { verifyEmailAction } from "@/app/verify/actions";
import { verifyEmailSchema } from "@/schemas/email-verification";

type Props = {
  searchParams: Promise<{ token?: string | string[] }>;
};

// 認証リンクの着地ページ。メールソフトのリンクプレビュー等のGETで認証が
// 完了しないよう、ここではボタンを表示するだけで検証はPOST(Server Action)で行う
export default async function VerifyPage({ searchParams }: Props) {
  const parsed = verifyEmailSchema.safeParse(await searchParams);
  if (!parsed.success) {
    redirect("/verify/invalid");
  }

  return (
    <AuthStatusLayout
      icon={MailCheck}
      title="メールアドレスの確認"
      description="下のボタンを押して、メールアドレスの確認を完了してください。"
    >
      <form action={verifyEmailAction}>
        <input type="hidden" name="token" value={parsed.data.token} />
        <Button type="submit" className={authSubmitClass}>
          メールアドレスを確認する
        </Button>
      </form>
    </AuthStatusLayout>
  );
}
