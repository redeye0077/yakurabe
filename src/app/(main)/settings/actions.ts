"use server";

import { auth } from "@/lib/auth";
import { SettingController } from "@/server/controllers/setting.controller";
import type { SettingImageUploadResult } from "@/types/setting-form";

/**
 * セッティング画像のアップロード先(署名付き POST)を発行する Server Action。登録・編集フォームの送信時に呼ばれる。
 * 未ログインなら発行せず unauthenticated を返す(続けて呼ばれる保存の Action がログイン画面へリダイレクトする)。
 */
export async function createSettingImageUploadAction(input: {
  contentType: string;
  size: number;
}): Promise<SettingImageUploadResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { status: "unauthenticated" };
  }

  return SettingController.createImageUpload(userId, input);
}
