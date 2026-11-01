import { describe, it, expect } from "vitest";
import {
    createSettingImageUploadSchema,
    createSettingSchema,
    updateSettingSchema,
} from "@/schemas/setting";

describe("createSettingSchema", () => {
    const validInput = {
        title: "テストセッティング",
        description: "特徴・使用感",
        barrelId: "barrel-1",
        shaftId: "shaft-1",
        flightId: "flight-1",
        tipId: "tip-1",
    };

    it("正しい入力を受け入れる", () => {
        const result = createSettingSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it("title と description の前後の空白を除去する", () => {
        const result = createSettingSchema.parse({
            ...validInput,
            title: "　タイトル ",
            description: " 説明　",
        });
        expect(result.title).toBe("タイトル");
        expect(result.description).toBe("説明");
    });

    it("title は50文字、description は191文字まで受け入れる", () => {
        const result = createSettingSchema.safeParse({
            ...validInput,
            title: "a".repeat(50),
            description: "あ".repeat(191),
        });
        expect(result.success).toBe(true);
    });

    it.each([
        ["改行(\\n)", "1行目\n2行目"],
        ["改行(\\r\\n)", "1行目\r\n2行目"],
        ["タブ", "項目\t値"],
    ])("description は%sを含めて受け入れる", (_, description) => {
        const result = createSettingSchema.parse({ ...validInput, description });
        expect(result.description).toBe(description);
    });

    it.each([
        ["未送信(null)", null],
        ["空文字", ""],
        ["空白のみ", "  　"],
    ])("description が%sなら null にする", (_, description) => {
        const result = createSettingSchema.parse({ ...validInput, description });
        expect(result.description).toBeNull();
    });

    it.each([
        ["未送信(null)", null],
        ["空文字", ""],
    ])("shaftId が%sなら null にする", (_, shaftId) => {
        const result = createSettingSchema.parse({ ...validInput, shaftId });
        expect(result.shaftId).toBeNull();
    });

    it.each([
        ["title", "", "タイトルを入力してください"],
        ["title", "   ", "タイトルを入力してください"], // trim後に空
        ["title", null, "タイトルを入力してください"],
        ["title", "a".repeat(51), "タイトルは50文字以内で入力してください"],
        ["title", "title\u0000", "タイトルに使用できない文字が含まれています"], // 制御文字
        ["description", "あ".repeat(192), "特徴・使用感は191文字以内で入力してください"],
        ["description", new File([""], "a.txt"), "特徴・使用感の形式が正しくありません"],
        ["description", "説明\u0000", "特徴・使用感に使用できない文字が含まれています"], // NULL文字
        ["description", "説明\u001B", "特徴・使用感に使用できない文字が含まれています"], // ESC
        ["description", "説明​", "特徴・使用感に使用できない文字が含まれています"], // ゼロ幅スペース
        ["barrelId", "", "バレルを選択してください"],
        ["barrelId", null, "バレルを選択してください"],
        ["barrelId", new File([""], "a.txt"), "バレルを選択してください"],
        ["flightId", "", "フライトを選択してください"],
        ["tipId", "", "チップを選択してください"],
        ["shaftId", new File([""], "a.txt"), "シャフトの形式が正しくありません"],
    ])("%s が「%s」のときエラーになる", (field, value, expectedMessage) => {
        const result = createSettingSchema.safeParse({ ...validInput, [field]: value });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toEqual([field]);
            expect(result.error.issues[0].message).toBe(expectedMessage);
        }
    });
});

describe("createSettingSchema の imageKey", () => {
    const base = {
        title: "テストセッティング",
        description: "",
        barrelId: "barrel-1",
        shaftId: "shaft-1",
        flightId: "flight-1",
        tipId: "tip-1",
    };

    it.each([
        ["未送信(null)", null],
        ["空文字", ""],
        ["項目なし", undefined],
    ])("%s なら null にする", (_label, imageKey) => {
        expect(createSettingSchema.parse({ ...base, imageKey }).imageKey).toBeNull();
    });

    it("文字列はそのまま受け取る(形と本人のキーかは Service で確認する)", () => {
        const imageKey = "settings/user-1/123e4567-e89b-42d3-a456-426614174000.png";
        expect(createSettingSchema.parse({ ...base, imageKey }).imageKey).toBe(imageKey);
    });

    it.each([
        ["ファイル", new File([], "a.png")],
        ["192文字", "a".repeat(192)],
    ])("%s はエラー", (_label, imageKey) => {
        const result = createSettingSchema.safeParse({ ...base, imageKey });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]).toMatchObject({
            path: ["imageKey"],
            message: "画像を確認できませんでした。もう一度選択してください",
        });
    });
});

describe("updateSettingSchema", () => {
    it("imageKey が送られてきても結果に含めない(編集では画像を変更しない)", () => {
        const result = updateSettingSchema.parse({
            title: "テストセッティング",
            description: "",
            barrelId: "barrel-1",
            shaftId: "shaft-1",
            flightId: "flight-1",
            tipId: "tip-1",
            imageKey: "settings/user-1/123e4567-e89b-42d3-a456-426614174000.png",
        });
        expect(result).not.toHaveProperty("imageKey");
    });
});

describe("createSettingImageUploadSchema", () => {
    it.each(["image/jpeg", "image/png", "image/webp"])("%s・1バイト〜5MB を受け入れる", (contentType) => {
        expect(createSettingImageUploadSchema.safeParse({ contentType, size: 1 }).success).toBe(true);
        expect(createSettingImageUploadSchema.safeParse({ contentType, size: 5 * 1024 * 1024 }).success).toBe(true);
    });

    it.each(["image/gif", "image/svg+xml", "text/html", "", null])("形式 %s はエラー", (contentType) => {
        const result = createSettingImageUploadSchema.safeParse({ contentType, size: 100 });
        expect(result.error?.issues[0]?.message).toBe("JPEG・PNG・WebP の画像を選択してください");
    });

    it("5MB を超えるとサイズのエラー", () => {
        const result = createSettingImageUploadSchema.safeParse({
            contentType: "image/png",
            size: 5 * 1024 * 1024 + 1,
        });
        expect(result.error?.issues[0]?.message).toBe("画像は 5MB 以下にしてください");
    });

    it.each([
        ["0バイト", 0],
        ["小数", 1.5],
        ["文字列", "100"],
    ])("サイズが %s ならエラー", (_label, size) => {
        expect(createSettingImageUploadSchema.safeParse({ contentType: "image/png", size }).success).toBe(false);
    });
});
