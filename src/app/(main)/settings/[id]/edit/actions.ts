"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { readSettingFormData, toFormValuesFromInput } from "@/lib/setting-form-values";
import { SettingController } from "@/server/controllers/setting.controller";
import type { SettingFormActionState } from "@/types/setting-form";

/**
 * セッティング編集フォームから呼ばれるServer Action(useActionState 用)。編集ページで id を bind して渡す。
 * 入力エラー・業務ルール違反は項目ごとのエラーと入力値を、対象が見つからない場合はメッセージと入力値を返す。
 * 成功したらマイページへリダイレクトする。redirect()は例外で遷移を実現するため、try/catchの中では呼ばない。
 */
export async function updateSettingAction(
  id: string,
  _prevState: SettingFormActionState,
  formData: FormData,
): Promise<SettingFormActionState> {
  // middlewareで保護済みだが、セッションが切れていた場合はログイン後にフォームへ戻れるようにする
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/settings/${id}/edit`)}`);
  }

  const input = readSettingFormData(formData);

  const result = await SettingController.update(userId, { id, ...input });
  if (result.status === "invalid") {
    return { fieldErrors: result.fieldErrors, values: toFormValuesFromInput(input) };
  }

  // 自分の投稿を表示するマイページと、一覧・トップを最新にする。
  // not_found でもすでに削除されている可能性があるため、表示を最新にする
  revalidatePath("/mypage");
  revalidatePath("/settings");
  revalidatePath("/");

  if (result.status === "not_found") {
    return { fieldErrors: {}, values: toFormValuesFromInput(input), message: result.message };
  }
  redirect("/mypage");
}
