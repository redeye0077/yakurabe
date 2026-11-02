import { describe, it, expect, vi } from "vitest";
import { notFound, redirect } from "next/navigation";
import { SETTING_FORM_ERROR_MESSAGE, withFormError } from "@/lib/with-form-error";
import type { SettingFormActionState } from "@/types/setting-form";

// 本物の redirect()・notFound() が投げる Next.js の内部エラーを取り出す
function thrownBy(fn: () => never): unknown {
    try {
        fn();
    } catch (error) {
        return error;
    }
    throw new Error("例外が投げられませんでした");
}

function createFormData(): FormData {
    const formData = new FormData();
    formData.set("title", "テストセッティング");
    formData.set("description", "");
    formData.set("barrelId", "barrel-1");
    formData.set("shaftId", "shaft-1");
    formData.set("flightId", "flight-1");
    formData.set("tipId", "tip-1");
    formData.set("imageKey", "settings/user-1/123e4567-e89b-42d3-a456-426614174000.png");
    return formData;
}

describe("withFormError", () => {
    it("Action の結果をそのまま返す", async () => {
        const state: SettingFormActionState = {
            fieldErrors: { title: "タイトルを入力してください" },
            values: {
                title: "",
                description: "",
                barrelId: "",
                shaftId: "",
                flightId: "",
                tipId: "",
                imageKey: "",
            },
        };
        const action = vi.fn().mockResolvedValue(state);

        const formData = createFormData();
        await expect(withFormError(action)(null, formData)).resolves.toBe(state);
        expect(action).toHaveBeenCalledWith(null, formData);
    });

    it("Action が例外を投げたら、formError と送信した入力値を返す(imageKey は戻さない)", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        const action = vi.fn().mockRejectedValue(new Error("An error occurred in the Server Components render"));

        const result = await withFormError(action)(null, createFormData());

        expect(result).toEqual({
            fieldErrors: {},
            values: {
                title: "テストセッティング",
                description: "",
                barrelId: "barrel-1",
                shaftId: "shaft-1",
                flightId: "flight-1",
                tipId: "tip-1",
                imageKey: "",
            },
            formError: "送信に失敗しました。時間をおいて再度お試しください",
        });
        expect(SETTING_FORM_ERROR_MESSAGE).toBe("送信に失敗しました。時間をおいて再度お試しください");
        expect(consoleError).toHaveBeenCalledTimes(1);
        consoleError.mockRestore();
    });

    it("成功時の redirect() のエラーは握りつぶさずに投げ直す(遷移させる)", async () => {
        const redirectError = thrownBy(() => redirect("/mypage"));
        const action = vi.fn().mockRejectedValue(redirectError);

        await expect(withFormError(action)(null, createFormData())).rejects.toBe(redirectError);
    });

    it("notFound() のエラーも投げ直す", async () => {
        const notFoundError = thrownBy(() => notFound());
        const action = vi.fn().mockRejectedValue(notFoundError);

        await expect(withFormError(action)(null, createFormData())).rejects.toBe(notFoundError);
    });
});
