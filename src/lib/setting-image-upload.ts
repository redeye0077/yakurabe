import {
  detectImageType,
  IMAGE_SIGNATURE_BYTES,
  SETTING_IMAGE_MAX_BYTES,
  SETTING_IMAGE_SIZE_MESSAGE,
  SETTING_IMAGE_TYPE_MESSAGE,
  type SettingImageType,
} from "@/lib/setting-image";
import type { SettingImageUploadDto } from "@/server/dto/setting.dto";

/**
 * 選択された画像ファイルを送信前に確認する(画面側)。
 * ブラウザが付ける file.type は拡張子由来で信用できないため、先頭バイトで形式を判定する。
 * サーバーでも保存時に S3 上の実物で同じ確認をする
 */
export async function checkSettingImageFile(
  file: File
): Promise<{ ok: true; type: SettingImageType } | { ok: false; message: string }> {
  if (file.size > SETTING_IMAGE_MAX_BYTES) {
    return { ok: false, message: SETTING_IMAGE_SIZE_MESSAGE };
  }
  const head = new Uint8Array(await file.slice(0, IMAGE_SIGNATURE_BYTES).arrayBuffer());
  const type = detectImageType(head);
  if (!type) {
    return { ok: false, message: SETTING_IMAGE_TYPE_MESSAGE };
  }
  return { ok: true, type };
}

/**
 * 署名付き POST で、ブラウザから S3 に直接アップロードする。失敗したら throw する。
 * S3 は file より後ろのフィールドを無視するため、file は必ず最後に入れる
 */
export async function uploadSettingImage(upload: SettingImageUploadDto, file: File): Promise<void> {
  const body = new FormData();
  for (const [name, value] of Object.entries(upload.fields)) {
    body.append(name, value);
  }
  body.append("file", file);

  const response = await fetch(upload.url, { method: "POST", body });
  if (!response.ok) {
    throw new Error(`画像のアップロードに失敗しました: ${response.status}`);
  }
}
