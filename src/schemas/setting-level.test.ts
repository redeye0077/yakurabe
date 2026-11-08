import { describe, it, expect } from "vitest";
import { SETTING_LEVEL_LABELS } from "@/schemas/setting-level";

describe("SETTING_LEVEL_LABELS", () => {
    // 画面に出る文言なので、定数から期待値を作らずに直接書いて比べる(文言を変えたらここで気づける)
    it("各レベルの表示名", () => {
        expect(SETTING_LEVEL_LABELS).toEqual({
            BEGINNER: "初心者向け",
            INTERMEDIATE: "中級者向け",
            ADVANCED: "上級者向け",
        });
    });
});
