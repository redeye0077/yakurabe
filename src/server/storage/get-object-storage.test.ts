import { afterEach, describe, expect, it, vi } from "vitest";
import { getObjectStorage, resetObjectStorageForTest } from "@/server/storage/get-object-storage";
import { S3ObjectStorage } from "@/server/storage/s3-object-storage";

afterEach(() => {
  vi.unstubAllEnvs();
  resetObjectStorageForTest();
});

function stubStorageEnv() {
  vi.stubEnv("S3_REGION", "ap-northeast-1");
  vi.stubEnv("S3_BUCKET", "yakurabe-test");
  vi.stubEnv("S3_ACCESS_KEY_ID", "dummy");
  vi.stubEnv("S3_SECRET_ACCESS_KEY", "dummy");
  vi.stubEnv("S3_PUBLIC_BASE_URL", "http://localhost:9090/yakurabe-test");
}

describe("getObjectStorage", () => {
  it("環境変数がそろっていればS3ObjectStorageを返す", () => {
    stubStorageEnv();
    expect(getObjectStorage()).toBeInstanceOf(S3ObjectStorage);
  });

  it("2回目以降は同じインスタンスを返す", () => {
    stubStorageEnv();
    expect(getObjectStorage()).toBe(getObjectStorage());
  });

  it("S3_ENDPOINT・S3_PUBLIC_ENDPOINTが空文字なら未設定として扱う", () => {
    stubStorageEnv();
    vi.stubEnv("S3_ENDPOINT", "");
    vi.stubEnv("S3_PUBLIC_ENDPOINT", "");
    expect(getObjectStorage()).toBeInstanceOf(S3ObjectStorage);
  });

  it("アクセスキーが無ければエラーになる", () => {
    stubStorageEnv();
    vi.stubEnv("S3_ACCESS_KEY_ID", undefined);
    expect(() => getObjectStorage()).toThrow(/S3_ACCESS_KEY_ID/);
  });

  it("S3_PUBLIC_BASE_URLがURL形式でなければエラーになる", () => {
    stubStorageEnv();
    vi.stubEnv("S3_PUBLIC_BASE_URL", "not-a-url");
    expect(() => getObjectStorage()).toThrow(/S3_PUBLIC_BASE_URL/);
  });

  it("S3_ENDPOINTがURL形式でなければエラーになる", () => {
    stubStorageEnv();
    vi.stubEnv("S3_ENDPOINT", "s3mock");
    expect(() => getObjectStorage()).toThrow(/S3_ENDPOINT/);
  });
});
