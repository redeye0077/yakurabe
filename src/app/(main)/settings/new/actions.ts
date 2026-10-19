"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { CreateSettingField } from "@/schemas/setting";
import {
  SettingController,
  type CreateSettingFieldErrors,
} from "@/server/controllers/setting.controller";

// エラー時にフォームへ戻す入力値。ファイルなど文字列以外は空文字にする
export type CreateSettingFormValues = Record<CreateSettingField, string>;

export type CreateSettingActionState = {
  fieldErrors: CreateSettingFieldErrors;
  values: CreateSettingFormValues;
} | null;

/**
 * セッティング登録フォームから呼ばれるServer Action(useActionState 用)。
 * 入力エラー・業務ルール違反は項目ごとのエラーと入力値を返し、成功したらマイページへリダイレクトする。
 * redirect()は例外で遷移を実現するため、try/catchの中では呼ばない。
 */
export async function createSettingAction(
  _prevState: CreateSettingActionState,
  formData: FormData,
): Promise<CreateSettingActionState> {
  // middlewareで保護済みだが、セッションが切れていた場合はログイン後にフォームへ戻れるようにする
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login?callbackUrl=/settings/new");
  }

  const input = {
    title: formData.get("title"),
    description: formData.get("description"),
    barrelId: formData.get("barrelId"),
    shaftId: formData.get("shaftId"),
    flightId: formData.get("flightId"),
    tipId: formData.get("tipId"),
  };

  const result = await SettingController.create(userId, input);
  if (result.status === "invalid") {
    return { fieldErrors: result.fieldErrors, values: toFormValues(input) };
  }

  // 新着を表示するトップ・一覧と、自分の投稿を表示するマイページを最新にする
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/mypage");
  redirect("/mypage");
}

function toFormValues(input: Record<CreateSettingField, FormDataEntryValue | null>): CreateSettingFormValues {
  const str = (value: FormDataEntryValue | null) => (typeof value === "string" ? value : "");
  return {
    title: str(input.title),
    description: str(input.description),
    barrelId: str(input.barrelId),
    shaftId: str(input.shaftId),
    flightId: str(input.flightId),
    tipId: str(input.tipId),
  };
}
