import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildSettingImageKey,
  detectImageType,
  IMAGE_SIGNATURE_BYTES,
  isOwnSettingImageKey,
  isSettingImageType,
  parseSettingImageKey,
  SETTING_IMAGE_MAX_BYTES,
} from "@/lib/setting-image";

afterEach(() => {
  vi.restoreAllMocks();
});

const UUID = "123e4567-e89b-42d3-a456-426614174000";

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

function ascii(text: string): number[] {
  return [...text].map((c) => c.charCodeAt(0));
}

const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, ...ascii("JFIF"), 0x00, 0x01);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d);
const WEBP = bytes(...ascii("RIFF"), 0x24, 0x00, 0x00, 0x00, ...ascii("WEBP"));

describe("SETTING_IMAGE_MAX_BYTES", () => {
  it("5MB", () => {
    expect(SETTING_IMAGE_MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});

describe("isSettingImageType", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("%s は許可する", (type) => {
    expect(isSettingImageType(type)).toBe(true);
  });

  it.each(["image/gif", "image/svg+xml", "text/html", "", undefined, 1])(
    "%s は許可しない",
    (type) => {
      expect(isSettingImageType(type)).toBe(false);
    }
  );
});

describe("detectImageType", () => {
  it("JPEG・PNG・WebP を先頭バイトで判定する", () => {
    expect(detectImageType(JPEG)).toBe("image/jpeg");
    expect(detectImageType(PNG)).toBe("image/png");
    expect(detectImageType(WEBP)).toBe("image/webp");
  });

  it(`判定に使うのは先頭 ${IMAGE_SIGNATURE_BYTES} バイトまで`, () => {
    for (const sample of [JPEG, PNG, WEBP]) {
      const longer = new Uint8Array(32);
      longer.set(sample.slice(0, IMAGE_SIGNATURE_BYTES));
      expect(detectImageType(longer)).toBe(detectImageType(sample));
    }
  });

  it("RIFF でも WEBP でなければ(WAV など)判定しない", () => {
    expect(detectImageType(bytes(...ascii("RIFF"), 0x24, 0x00, 0x00, 0x00, ...ascii("WAVE")))).toBeNull();
  });

  it("GIF・HTML・空・途中で切れたデータは null", () => {
    expect(detectImageType(bytes(...ascii("GIF89a")))).toBeNull();
    expect(detectImageType(bytes(...ascii("<!doctype html>")))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
    expect(detectImageType(PNG.slice(0, 4))).toBeNull();
    expect(detectImageType(WEBP.slice(0, 10))).toBeNull();
  });
});

describe("buildSettingImageKey", () => {
  it("settings/{userId}/{UUID}.{拡張子} を作る", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(UUID);
    expect(buildSettingImageKey("user1", "image/jpeg")).toBe(`settings/user1/${UUID}.jpg`);
    expect(buildSettingImageKey("user1", "image/png")).toBe(`settings/user1/${UUID}.png`);
    expect(buildSettingImageKey("user1", "image/webp")).toBe(`settings/user1/${UUID}.webp`);
  });

  it("毎回違うキーになる", () => {
    expect(buildSettingImageKey("user1", "image/png")).not.toBe(
      buildSettingImageKey("user1", "image/png")
    );
  });

  it("作ったキーは parseSettingImageKey で読み戻せる(cuid の userId)", () => {
    const userId = "cmgk1x2y30000abcd1234efgh";
    expect(parseSettingImageKey(buildSettingImageKey(userId, "image/webp"))).toEqual({
      userId,
      type: "image/webp",
    });
  });
});

describe("parseSettingImageKey", () => {
  it("userId と拡張子から決まる形式を返す", () => {
    expect(parseSettingImageKey(`settings/user1/${UUID}.jpg`)).toEqual({
      userId: "user1",
      type: "image/jpeg",
    });
  });

  it.each([
    ["prefix が違う", `uploads/user1/${UUID}.jpg`],
    ["userId が無い", `settings/${UUID}.jpg`],
    ["階層が深い", `settings/user1/x/${UUID}.jpg`],
    ["パスの上り", `settings/../user1/${UUID}.jpg`],
    ["UUID でない", "settings/user1/image.jpg"],
    ["UUID が大文字", `settings/user1/${UUID.toUpperCase()}.jpg`],
    ["許可しない拡張子", `settings/user1/${UUID}.gif`],
    ["jpeg 表記", `settings/user1/${UUID}.jpeg`],
    ["拡張子なし", `settings/user1/${UUID}`],
    ["前後に余分な文字", ` settings/user1/${UUID}.jpg`],
    ["末尾に改行", `settings/user1/${UUID}.jpg\n`],
    ["空", ""],
  ])("%s なら null", (_, key) => {
    expect(parseSettingImageKey(key)).toBeNull();
  });
});

describe("isOwnSettingImageKey", () => {
  it("本人の prefix なら true", () => {
    expect(isOwnSettingImageKey("user1", `settings/user1/${UUID}.png`)).toBe(true);
  });

  it("他人の prefix なら false", () => {
    expect(isOwnSettingImageKey("user1", `settings/user2/${UUID}.png`)).toBe(false);
  });

  it("userId の前方一致では true にならない", () => {
    expect(isOwnSettingImageKey("user1", `settings/user10/${UUID}.png`)).toBe(false);
  });

  it("形が正しくなければ本人の prefix でも false", () => {
    expect(isOwnSettingImageKey("user1", "settings/user1/image.png")).toBe(false);
  });
});
