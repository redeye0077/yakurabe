"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  authInputClass,
  authLabelClass,
  authSubmitClass,
} from "@/components/auth/auth-styles";
import {
  resendVerificationSchema,
  type ResendVerificationInput,
} from "@/schemas/email-verification";
import { resendVerificationAction } from "@/app/verify/resend/actions";

export function ResendForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ResendVerificationInput>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ResendVerificationInput) {
    const formData = new FormData();
    formData.set("email", values.email);

    startTransition(async () => {
      setServerError(null);
      // 成功時はServer Action側のredirect()で完了画面へ遷移する。
      // redirect時の戻り値の扱いが変わっても壊れないよう、resultが無い場合も考慮する
      const result = await resendVerificationAction(formData);
      setServerError(result?.error ?? null);
    });
  }

  return (
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
              <FormLabel className={authLabelClass}>メールアドレス</FormLabel>
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

        {serverError && (
          <p
            role="alert"
            className="rounded-[10px] border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive"
          >
            {serverError}
          </p>
        )}

        <Button type="submit" className={authSubmitClass} disabled={isPending}>
          {isPending ? "送信中..." : "確認メールを再送する"}
        </Button>
      </form>
    </Form>
  );
}
