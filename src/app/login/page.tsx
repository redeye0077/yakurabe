"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema } from "@/schemas/auth";
import { LOGIN_ERROR_CODE } from "@/lib/auth-error-codes";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AuthBrandPanel,
  AuthMobileLogo,
} from "@/components/auth/auth-brand-panel";
import {
  authInputClass,
  authLabelClass,
  authLinkClass,
  authSubmitClass,
  authToggleClass,
} from "@/components/auth/auth-styles";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type LoginFormValues = z.infer<typeof loginSchema>;

// 未認証かどうかで表示を切り替えるため、signInが返したcodeを持たせる
class LoginError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
    this.name = "LoginError";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation<unknown, LoginError, LoginFormValues>({
    mutationFn: async (values: LoginFormValues) => {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      }).catch(() => undefined); // 通信失敗などは下で共通エラーとして扱う

      // signInは認証失敗では例外を投げないので、ここで手動でエラー判定してthrowする
      if (result?.code === LOGIN_ERROR_CODE.emailNotVerified) {
        throw new LoginError(
          "メールアドレスの確認が完了していません。登録時にお送りした確認メールのリンクを開いてください。",
          result.code
        );
      }
      if (result?.error === "CredentialsSignin") {
        throw new LoginError("メールアドレスまたはパスワードが違います");
      }
      // DB障害などは NextAuth が CredentialsSignin 以外(Configuration等)で返す
      if (!result || result.error || !result.ok) {
        throw new LoginError(
          "エラーが発生しました。時間をおいて再度お試しください"
        );
      }

      return result;
    },
    onSuccess: () => {
      router.push("/"); // 遷移先は後で確定
    },
  });

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }

  return (
    <div className="flex min-h-screen bg-brand-ivory text-brand-ink">
      <AuthBrandPanel />

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="flex w-full max-w-[360px] flex-col gap-7">
          <AuthMobileLogo />

          <div className="flex flex-col gap-2 text-center lg:text-left">
            <h1 className="font-heading text-2xl font-semibold lg:text-[28px]">
              ログイン
            </h1>
            <p className="text-sm text-brand-muted">
              アカウント情報を入力してください
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={authLabelClass}>
                      メールアドレス
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={authInputClass}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={authLabelClass}>パスワード</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="8文字以上"
                          autoComplete="current-password"
                          className={`${authInputClass} pr-11`}
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className={authToggleClass}
                        aria-label={
                          showPassword ? "パスワードを隠す" : "パスワードを表示"
                        }
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="size-[18px]" />
                        ) : (
                          <Eye className="size-[18px]" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {loginMutation.isError && (
                <p
                  role="alert"
                  className="rounded-[10px] border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
                >
                  {loginMutation.error.message}
                  {loginMutation.error.code ===
                    LOGIN_ERROR_CODE.emailNotVerified && (
                    <>
                      <br />
                      <Link href="/verify/resend" className={authLinkClass}>
                        確認メールを再送する
                      </Link>
                    </>
                  )}
                </p>
              )}

              <Button
                type="submit"
                className={authSubmitClass}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "ログイン中..." : "ログイン"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-[13.5px] text-brand-muted">
            アカウントをお持ちでない方は{" "}
            <Link href="/register" className={authLinkClass}>
              新規登録
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
