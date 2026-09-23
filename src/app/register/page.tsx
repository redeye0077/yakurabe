"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { registerSchema } from "@/schemas/auth";
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

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (values: RegisterFormValues) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const errorPayload = data?.error;

        if (typeof errorPayload === "string") {
          throw new Error(errorPayload);
        }

        if (errorPayload && typeof errorPayload === "object") {
          const firstField = Object.values(errorPayload)[0];
          const firstMessage = Array.isArray(firstField)
            ? firstField[0]
            : undefined;
          throw new Error(firstMessage ?? "入力内容を確認してください");
        }

        throw new Error("登録に失敗しました");
      }

      return res.json();
    },
    onSuccess: () => {
      router.push("/login");
    },
  });

  function onSubmit(values: RegisterFormValues) {
    registerMutation.mutate(values);
  }

  return (
    <div className="flex min-h-screen bg-brand-ivory text-brand-ink">
      <AuthBrandPanel />

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="flex w-full max-w-[360px] flex-col gap-6">
          <AuthMobileLogo />

          <div className="flex flex-col gap-2 text-center lg:text-left">
            <h1 className="font-heading text-2xl font-semibold lg:text-[28px]">
              新規登録
            </h1>
            <p className="text-sm text-brand-muted">
              アカウントを作成してセッティングを共有しましょう
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={authLabelClass}>ユーザー名</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ダーツ太郎"
                        autoComplete="nickname"
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
                          autoComplete="new-password"
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

              {registerMutation.isError && (
                <p
                  role="alert"
                  className="rounded-[10px] border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
                >
                  {registerMutation.error.message}
                </p>
              )}

              <Button
                type="submit"
                className={authSubmitClass}
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "登録中..." : "新規登録"}
              </Button>
            </form>
          </Form>

          <p className="text-center text-[13.5px] text-brand-muted">
            すでにアカウントをお持ちの方は{" "}
            <Link href="/login" className={authLinkClass}>
              ログイン
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
