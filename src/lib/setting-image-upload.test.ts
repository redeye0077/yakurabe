import { afterEach, describe, expect, it, vi } from "vitest";
import { checkSettingImageFile, uploadSettingImage } from "@/lib/setting-image-upload";

afterEach(() => {
    vi.unstubAllGlobals();
});

const PNG_HEAD = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d];

function fileOf(bytes: number[], options: { type?: string; padTo?: number } = {}): File {
    const body = new Uint8Array(Math.max(bytes.length, options.padTo ?? 0));
    body.set(bytes);
    return new File([body], "image.png", { type: options.type ?? "image/png" });
}

describe("checkSettingImageFile", () => {
    it("先頭バイトで判定した形式を返す(file.type は見ない)", async () => {
        await expect(checkSettingImageFile(fileOf(PNG_HEAD, { type: "image/jpeg" }))).resolves.toEqual({
            ok: true,
            type: "image/png",
        });
    });

    it("画像でなければ形式のエラー(拡張子・type が画像でも)", async () => {
        const html = [...new TextEncoder().encode("<!doctype html><p>")];
        await expect(checkSettingImageFile(fileOf(html, { type: "image/png" }))).resolves.toEqual({
            ok: false,
            message: "JPEG・PNG・WebP の画像を選択してください",
        });
    });

    it("5MB を超えればサイズのエラー", async () => {
        await expect(checkSettingImageFile(fileOf(PNG_HEAD, { padTo: 5 * 1024 * 1024 + 1 }))).resolves.toEqual({
            ok: false,
            message: "画像は 5MB 以下にしてください",
        });
    });

    it("ちょうど 5MB は通す", async () => {
        await expect(checkSettingImageFile(fileOf(PNG_HEAD, { padTo: 5 * 1024 * 1024 }))).resolves.toEqual({
            ok: true,
            type: "image/png",
        });
    });
});

describe("uploadSettingImage", () => {
    const upload = {
        url: "http://localhost:9090/yakurabe-dev",
        fields: { key: "settings/user-1/x.png", "Content-Type": "image/png", Policy: "policy" },
        key: "settings/user-1/x.png",
    };

    it("fields を先に、file を最後に入れて POST する", async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
        vi.stubGlobal("fetch", fetchMock);
        const file = fileOf(PNG_HEAD);

        await uploadSettingImage(upload, file);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe("http://localhost:9090/yakurabe-dev");
        expect(init.method).toBe("POST");
        const body = init.body as FormData;
        expect([...body.keys()]).toEqual(["key", "Content-Type", "Policy", "file"]);
        expect(body.get("file")).toBeInstanceOf(File);
    });

    it("S3 がエラーを返したら throw する(5MB 超・期限切れなど)", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("EntityTooLarge", { status: 400 })));

        await expect(uploadSettingImage(upload, fileOf(PNG_HEAD))).rejects.toThrow("400");
    });

    it("通信エラーはそのまま throw する", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

        await expect(uploadSettingImage(upload, fileOf(PNG_HEAD))).rejects.toThrow("Failed to fetch");
    });
});
