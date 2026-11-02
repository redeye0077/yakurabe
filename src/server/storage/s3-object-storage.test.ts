import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { parseTotalSize, S3ObjectStorage } from "@/server/storage/s3-object-storage";

afterEach(() => {
  vi.restoreAllMocks();
});

function createStorage(
  options: { endpoint?: string; publicEndpoint?: string; publicBaseUrl?: string } = {}
) {
  return new S3ObjectStorage({
    region: "ap-northeast-1",
    bucket: "yakurabe-test",
    accessKeyId: "dummy",
    secretAccessKey: "dummy",
    publicBaseUrl: "http://localhost:9090/yakurabe-test",
    ...options,
  });
}

function getObjectResponse(body: Uint8Array, headers: { ContentRange?: string; ContentLength?: number; ContentType?: string }) {
  return {
    ...headers,
    Body: { transformToByteArray: async () => body },
  };
}

function s3Error(status: number) {
  return new S3ServiceException({
    name: status === 404 ? "NoSuchKey" : "AccessDenied",
    $fault: "client",
    $metadata: { httpStatusCode: status },
  });
}

describe("S3ObjectStorage.createPresignedUpload", () => {
  it("key・Content-Type・サイズの条件を policy に入れ、Content-Type をフィールドに含める", async () => {
    const storage = createStorage({ endpoint: "http://s3mock:9090" });
    const { url, fields } = await storage.createPresignedUpload({
      key: "settings/user-1/abc.jpg",
      contentType: "image/jpeg",
      maxBytes: 5 * 1024 * 1024,
    });

    expect(url).toBe("http://s3mock:9090/yakurabe-test");
    expect(fields.key).toBe("settings/user-1/abc.jpg");
    expect(fields["Content-Type"]).toBe("image/jpeg");

    const policy = JSON.parse(Buffer.from(fields.Policy, "base64").toString("utf8"));
    expect(policy.conditions).toEqual(
      expect.arrayContaining([
        ["content-length-range", 1, 5 * 1024 * 1024],
        ["eq", "$Content-Type", "image/jpeg"],
        ["eq", "$key", "settings/user-1/abc.jpg"],
      ])
    );
    // 有効期限は 300 秒後(発行処理の時間を見込んで幅を持たせる)
    const expiresInMs = new Date(policy.expiration).getTime() - Date.now();
    expect(expiresInMs).toBeGreaterThan(290 * 1000);
    expect(expiresInMs).toBeLessThanOrEqual(300 * 1000);
  });

  it("S3_PUBLIC_ENDPOINT があれば署名付き URL はそちらのホストになる", async () => {
    const storage = createStorage({
      endpoint: "http://s3mock:9090",
      publicEndpoint: "http://localhost:9090",
    });
    const { url } = await storage.createPresignedUpload({
      key: "settings/user-1/abc.png",
      contentType: "image/png",
      maxBytes: 100,
    });
    expect(url).toBe("http://localhost:9090/yakurabe-test");
  });

  it("接続先を指定しなければ S3 の既定の接続先(バケット名入りのホスト)になる", async () => {
    const storage = createStorage();
    const { url } = await storage.createPresignedUpload({
      key: "settings/user-1/abc.webp",
      contentType: "image/webp",
      maxBytes: 100,
    });
    expect(url).toBe("https://yakurabe-test.s3.ap-northeast-1.amazonaws.com/");
  });
});

describe("S3ObjectStorage.inspect", () => {
  it("先頭 16 バイトを Range で1回だけ取得し、Content-Type と全体のサイズを返す", async () => {
    const body = new Uint8Array(16).fill(0xff);
    const send = vi
      .spyOn(S3Client.prototype, "send")
      .mockImplementation(async () =>
        getObjectResponse(body, { ContentRange: "bytes 0-15/12345", ContentLength: 16, ContentType: "image/jpeg" })
      );

    const result = await createStorage().inspect("settings/user-1/abc.jpg");

    expect(result).toEqual({ contentType: "image/jpeg", size: 12345, firstBytes: body });
    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(GetObjectCommand);
    expect(command.input).toEqual({
      Bucket: "yakurabe-test",
      Key: "settings/user-1/abc.jpg",
      Range: "bytes=0-15",
    });
  });

  it("Range が無視されて全体が返った場合は ContentLength を全体のサイズとし、先頭 16 バイトだけ返す", async () => {
    const body = new Uint8Array(20).map((_, i) => i);
    vi.spyOn(S3Client.prototype, "send").mockImplementation(async () =>
      getObjectResponse(body, { ContentLength: 20, ContentType: "image/png" })
    );

    const result = await createStorage().inspect("settings/user-1/abc.png");

    expect(result?.size).toBe(20);
    expect(result?.firstBytes).toEqual(body.slice(0, 16));
  });

  it("403 のときはキーとステータスを console.warn に出して null を返す", async () => {
    vi.spyOn(S3Client.prototype, "send").mockImplementation(async () => {
      throw s3Error(403);
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(createStorage().inspect("settings/user-1/none.jpg")).resolves.toBeNull();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.any(String), {
      key: "settings/user-1/none.jpg",
      status: 403,
    });
  });

  it.each([404, 416])("%i のときはログを出さずに null を返す", async (status) => {
    vi.spyOn(S3Client.prototype, "send").mockImplementation(async () => {
      throw s3Error(status);
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(createStorage().inspect("settings/user-1/none.jpg")).resolves.toBeNull();

    expect(warn).not.toHaveBeenCalled();
  });

  it("それ以外のエラーはそのまま投げる", async () => {
    vi.spyOn(S3Client.prototype, "send").mockImplementation(async () => {
      throw s3Error(500);
    });
    await expect(createStorage().inspect("settings/user-1/abc.jpg")).rejects.toBeInstanceOf(
      S3ServiceException
    );
  });
});

describe("S3ObjectStorage.delete", () => {
  it("DeleteObject を呼ぶ", async () => {
    const send = vi.spyOn(S3Client.prototype, "send").mockImplementation(async () => ({}));
    await createStorage().delete("settings/user-1/abc.jpg");
    const command = send.mock.calls[0][0];
    expect(command).toBeInstanceOf(DeleteObjectCommand);
    expect(command.input).toEqual({ Bucket: "yakurabe-test", Key: "settings/user-1/abc.jpg" });
  });
});

describe("S3ObjectStorage.publicUrl", () => {
  const key = "settings/user-1/abc.jpg";

  it("S3_PUBLIC_BASE_URL とキーを1つの / でつなぐ(開発: http://localhost:9090/<バケット名>)", () => {
    expect(createStorage().publicUrl(key)).toBe(
      "http://localhost:9090/yakurabe-test/settings/user-1/abc.jpg"
    );
  });

  it.each([
    ["末尾に /", "http://localhost:9090/yakurabe-test/"],
    ["末尾に //", "http://localhost:9090/yakurabe-test//"],
  ])("S3_PUBLIC_BASE_URL の%sが付いていても二重スラッシュにしない", (_, publicBaseUrl) => {
    expect(createStorage({ publicBaseUrl }).publicUrl(key)).toBe(
      "http://localhost:9090/yakurabe-test/settings/user-1/abc.jpg"
    );
  });

  it("キーの先頭に / があっても二重スラッシュにしない", () => {
    expect(createStorage().publicUrl(`/${key}`)).toBe(
      "http://localhost:9090/yakurabe-test/settings/user-1/abc.jpg"
    );
  });

  it("本番の形(バケット名入りのホスト)でもつなぎ方は同じ", () => {
    const storage = createStorage({
      publicBaseUrl: "https://yakurabe-images-prod.s3.ap-northeast-1.amazonaws.com",
    });
    expect(storage.publicUrl(key)).toBe(
      "https://yakurabe-images-prod.s3.ap-northeast-1.amazonaws.com/settings/user-1/abc.jpg"
    );
  });

  it("通信しない", () => {
    const send = vi.spyOn(S3Client.prototype, "send");
    createStorage().publicUrl(key);
    expect(send).not.toHaveBeenCalled();
  });
});

describe("parseTotalSize", () => {
  it.each([
    ["bytes 0-15/12345", 12345],
    ["bytes 0-9/10", 10],
    ["bytes */12345", undefined],
    [undefined, undefined],
  ])("%s → %s", (input, expected) => {
    expect(parseTotalSize(input)).toBe(expected);
  });
});
