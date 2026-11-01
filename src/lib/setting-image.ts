/**
 * セッティング画像の形式・サイズ・保存先キーのルール。
 * 画面(ファイル選択時の事前チェック)とサーバー(保存時の確認)の両方で使うため、server-only にはしない
 */

/** 画像の最大サイズ(5MB) */
export const SETTING_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** 許可する画像形式(Content-Type) */
export const SETTING_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type SettingImageType = (typeof SETTING_IMAGE_TYPES)[number];

/** 形式ごとの拡張子。保存先キーの拡張子はファイル名ではなく、この対応表で決める */
export const SETTING_IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const satisfies Record<SettingImageType, string>;

export type SettingImageExtension = (typeof SETTING_IMAGE_EXTENSIONS)[SettingImageType];

/** detectImageType の判定に必要な先頭のバイト数(WebP の "RIFF" + サイズ + "WEBP") */
export const IMAGE_SIGNATURE_BYTES = 12;

export function isSettingImageType(value: unknown): value is SettingImageType {
  return (SETTING_IMAGE_TYPES as readonly unknown[]).includes(value);
}

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  return signature.every((byte, i) => bytes[offset + i] === byte);
}

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff] as const;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46] as const; // "RIFF"
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50] as const; // "WEBP"(8バイト目から)

/**
 * 先頭のバイト列から画像形式を判定する。許可した形式でなければ null。
 * ブラウザが申告する Content-Type(ファイルの拡張子由来)は信用せず、中身で判定するために使う
 */
export function detectImageType(bytes: Uint8Array): SettingImageType | null {
  if (startsWith(bytes, JPEG_SIGNATURE)) return "image/jpeg";
  if (startsWith(bytes, PNG_SIGNATURE)) return "image/png";
  if (startsWith(bytes, RIFF_SIGNATURE) && startsWith(bytes, WEBP_SIGNATURE, 8)) {
    return "image/webp";
  }
  return null;
}

/** 保存先キーの先頭。バケットの公開読み取り・IAM の許可はこの prefix(settings/*)に限っている */
const SETTING_IMAGE_KEY_PREFIX = "settings";

/**
 * 保存先キーを作る: settings/{userId}/{UUID}.{拡張子}
 * userId を含めるのは、保存時に「本人がアップロードした画像か」をキーで確認するため
 */
export function buildSettingImageKey(userId: string, type: SettingImageType): string {
  return `${SETTING_IMAGE_KEY_PREFIX}/${userId}/${crypto.randomUUID()}.${SETTING_IMAGE_EXTENSIONS[type]}`;
}

const SETTING_IMAGE_KEY_PATTERN = new RegExp(
  `^${SETTING_IMAGE_KEY_PREFIX}/([A-Za-z0-9_-]+)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png|webp)$`
);

const TYPE_BY_EXTENSION = Object.fromEntries(
  SETTING_IMAGE_TYPES.map((type) => [SETTING_IMAGE_EXTENSIONS[type], type])
) as Record<SettingImageExtension, SettingImageType>;

/**
 * buildSettingImageKey で作った形のキーなら、userId と拡張子から決まる形式を返す。形が違えば null。
 * 画面から送られてくるキーは改ざんできるため、保存前に必ずこれで形を確認する
 */
export function parseSettingImageKey(
  key: string
): { userId: string; type: SettingImageType } | null {
  const match = SETTING_IMAGE_KEY_PATTERN.exec(key);
  if (!match) return null;
  return { userId: match[1], type: TYPE_BY_EXTENSION[match[2] as SettingImageExtension] };
}

/** キーが本人(userId)の prefix で、正しい形をしているか */
export function isOwnSettingImageKey(userId: string, key: string): boolean {
  return parseSettingImageKey(key)?.userId === userId;
}
