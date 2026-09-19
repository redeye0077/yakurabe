import { describe, it, expect } from "vitest";
import { searchBarrelSchema } from "@/schemas/barrel";

describe("searchBarrelSchema", () => {
    it("qが未指定の場合は成功し、qはundefinedになる", () => {
        const result = searchBarrelSchema.safeParse({});

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.q).toBeUndefined();
        }
    });

    it("qが空文字の場合も成功する", () => {
        const result = searchBarrelSchema.safeParse({ q: "" });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.q).toBe("");
        }
    });

    it("qが文字列の場合は成功し、前後の空白がtrimされる", () => {
        const result = searchBarrelSchema.safeParse({ q: "  テストバレル  " });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.q).toBe("テストバレル");
        }
    });

    it("qが文字列以外の場合は失敗する", () => {
        const result = searchBarrelSchema.safeParse({ q: 123 });

        expect(result.success).toBe(false);
    });
});
