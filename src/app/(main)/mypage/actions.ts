"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  SettingController,
  type DeleteSettingResult,
} from "@/server/controllers/setting.controller";

export type DeleteSettingActionResult =
  | DeleteSettingResult
  | { status: "unauthorized"; message: string };

/**
 * マイページの削除ボタン(確認ダイアログ)から呼ばれるServer Action。
 * 結果に応じてダイアログを閉じるかメッセージを出すかは画面側で決めるため、redirectはしない。
 */
export async function deleteSettingAction(formData: FormData): Promise<DeleteSettingActionResult> {
  // middlewareで保護済みだが、セッションが切れていた場合はダイアログ内でログインを促す
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { status: "unauthorized", message: "ログインしてください" };
  }

  const result = await SettingController.delete(userId, { id: formData.get("id") });

  // not_found でもすでに削除されている可能性があるため、表示を最新にする
  if (result.status === "success" || result.status === "not_found") {
    revalidatePath("/mypage");
    revalidatePath("/settings");
    revalidatePath("/");
  }
  return result;
}
