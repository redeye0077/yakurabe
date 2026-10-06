// メール認証まわりの結果画面(成功・期限切れ・無効など)で共通のレイアウト
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  AuthBrandPanel,
  AuthMobileLogo,
} from "@/components/auth/auth-brand-panel";

type Props = {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  children?: ReactNode;
};

export function AuthStatusLayout({
  icon: Icon,
  title,
  description,
  children,
}: Props) {
  return (
    <div className="flex min-h-screen bg-brand-ivory text-brand-ink">
      <AuthBrandPanel />

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="flex w-full max-w-[360px] flex-col gap-6">
          <AuthMobileLogo />

          <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
            <Icon className="size-10 text-brand-brass" aria-hidden />
            <h1 className="font-heading text-2xl font-semibold lg:text-[28px]">
              {title}
            </h1>
            <p className="text-sm leading-[1.9] text-brand-muted">
              {description}
            </p>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
