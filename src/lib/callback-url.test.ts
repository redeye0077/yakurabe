import { describe, it, expect } from "vitest";
import { resolveCallbackUrl } from "@/lib/callback-url";

const origin = "http://localhost:3000";

describe("resolveCallbackUrl", () => {
    it("同じオリジンの絶対URLはパス・クエリ・ハッシュだけを返す", () => {
        expect(resolveCallbackUrl("http://localhost:3000/mypage?tab=posts#top", origin)).toBe("/mypage?tab=posts#top");
    });

    it("相対パスはそのまま返す", () => {
        expect(resolveCallbackUrl("/mypage", origin)).toBe("/mypage");
    });

    it("null・空文字の場合は / を返す", () => {
        expect(resolveCallbackUrl(null, origin)).toBe("/");
        expect(resolveCallbackUrl("", origin)).toBe("/");
    });

    it("別オリジンのURLは / を返す", () => {
        expect(resolveCallbackUrl("https://evil.com/mypage", origin)).toBe("/");
        expect(resolveCallbackUrl("http://localhost:4000/mypage", origin)).toBe("/");
    });

    it("プロトコル相対URL(//evil.com)は / を返す", () => {
        expect(resolveCallbackUrl("//evil.com", origin)).toBe("/");
    });

    it("バックスラッシュを使ったURL(/\\evil.com)は / を返す", () => {
        expect(resolveCallbackUrl("/\\evil.com", origin)).toBe("/");
    });

    it("javascript: などhttp(s)以外のURLは / を返す", () => {
        expect(resolveCallbackUrl("javascript:alert(1)", origin)).toBe("/");
    });

    it("解析できない値は / を返す", () => {
        expect(resolveCallbackUrl("http://", origin)).toBe("/");
    });

    it("ログイン画面自身は / を返す", () => {
        expect(resolveCallbackUrl("http://localhost:3000/login?callbackUrl=%2Fmypage", origin)).toBe("/");
    });
});
