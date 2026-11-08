// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingForm } from "@/components/features/setting/setting-form";
import type {
    SettingFormActionState,
    SettingFormValues,
    SettingImageUploadResult,
} from "@/types/setting-form";
import type { BarrelListItemDto } from "@/server/dto/barrel.dto";
import type { ShaftListItemDto } from "@/server/dto/shaft.dto";
import type { FlightListItemDto } from "@/server/dto/flight.dto";
import type { TipListItemDto } from "@/server/dto/tip.dto";
import { SETTING_LEVELS, SETTING_LEVEL_LABELS } from "@/schemas/setting-level";

const mockedAction = vi.fn<(prevState: SettingFormActionState, formData: FormData) => Promise<SettingFormActionState>>();
const mockedUploadAction = vi.fn<(input: { contentType: string; size: number }) => Promise<SettingImageUploadResult>>();

const barrels: BarrelListItemDto[] = [
    { id: "barrel-1", name: "テストバレルA", price: 17600, weight: 18 },
    { id: "barrel-2", name: "テストバレルB", price: 19800, weight: 20.5 },
];
const shafts: ShaftListItemDto[] = [
    { id: "shaft-1", name: "テストシャフト", price: 500, flightSystem: "UNIVERSAL" },
    { id: "shaft-2", name: "テストシャフトFIT", price: 600, flightSystem: "FIT" },
];
const flights: FlightListItemDto[] = [
    { id: "flight-1", name: "テストフライト", price: 1080, flightType: "MOLDED", flightSystem: "UNIVERSAL" },
    { id: "flight-2", name: "テストフライトFIT", price: 1200, flightType: "MOLDED", flightSystem: "FIT" },
];
const tips: TipListItemDto[] = [
    { id: "tip-1", name: "テストチップA", price: 770 },
    { id: "tip-2", name: "テストチップB", price: 880 },
];

// 編集時の初期値。1件目と異なる選択肢を選んでおき、初期値が反映されたことを区別できるようにする
const editValues: SettingFormValues = {
    title: "編集前のセッティング",
    level: "INTERMEDIATE",
    description: "編集前の使用感",
    barrelId: "barrel-2",
    shaftId: "shaft-2",
    flightId: "flight-2",
    tipId: "tip-2",
    imageKey: "",
};

function renderForm() {
    return render(
        <SettingForm action={mockedAction} barrels={barrels} shafts={shafts} flights={flights} tips={tips} />
    );
}

function renderEditForm() {
    return render(
        <SettingForm
            action={mockedAction}
            defaultValues={editValues}
            submitLabel="更新する"
            pendingLabel="更新中..."
            barrels={barrels}
            shafts={shafts}
            flights={flights}
            tips={tips}
        />
    );
}

// 送信された入力をそのまま values に詰めて、タイトルの入力エラーとして返す
function returnTitleError(_prevState: SettingFormActionState, formData: FormData): Promise<SettingFormActionState> {
    const str = (key: string) => {
        const value = formData.get(key);
        return typeof value === "string" ? value : "";
    };
    return Promise.resolve({
        fieldErrors: { title: "タイトルを入力してください" },
        values: {
            title: str("title"),
            level: str("level"),
            description: str("description"),
            barrelId: str("barrelId"),
            shaftId: str("shaftId"),
            flightId: str("flightId"),
            tipId: str("tipId"),
            imageKey: "",
        },
    });
}

function fillAllExceptTitle() {
    fireEvent.change(screen.getByLabelText("バレル"), { target: { value: "barrel-2" } });
    fireEvent.change(screen.getByLabelText("フライト"), { target: { value: "flight-1" } });
    fireEvent.change(screen.getByLabelText("シャフト"), { target: { value: "shaft-1" } });
    fireEvent.change(screen.getByLabelText("チップ"), { target: { value: "tip-2" } });
    fireEvent.change(screen.getByLabelText("対象レベル(任意)"), { target: { value: "ADVANCED" } });
    fireEvent.change(screen.getByLabelText("特徴・使用感(任意)"), { target: { value: "テスト" } });
}

describe("SettingForm", () => {
    beforeEach(() => {
        mockedAction.mockReset();
    });

    it("送信すると、props で渡した action をフォームの入力値で呼び出す", async () => {
        mockedAction.mockResolvedValue(null);
        renderForm();

        fireEvent.change(screen.getByLabelText("タイトル"), { target: { value: "テストセッティング" } });
        fillAllExceptTitle();
        fireEvent.click(screen.getByRole("button", { name: "登録する" }));

        await waitFor(() => expect(mockedAction).toHaveBeenCalledTimes(1));
        const [prevState, formData] = mockedAction.mock.calls[0];
        expect(prevState).toBeNull();
        expect(Object.fromEntries(formData)).toEqual({
            title: "テストセッティング",
            description: "テスト",
            barrelId: "barrel-2",
            shaftId: "shaft-1",
            flightId: "flight-1",
            tipId: "tip-2",
            level: "ADVANCED",
        });
    });

    it("対象レベルは「選択しない」を初期選択にし、選択肢の表示名を SETTING_LEVEL_LABELS から出す", () => {
        renderForm();

        const level = screen.getByLabelText<HTMLSelectElement>("対象レベル(任意)");
        expect(level.value).toBe("");
        expect(Array.from(level.options).map((option) => [option.value, option.text])).toEqual([
            ["", "選択しない"],
            ...SETTING_LEVELS.map((value) => [value, SETTING_LEVEL_LABELS[value]]),
        ]);
    });

    it("対象レベルを選ばずに送信すると、level を空文字で送る", async () => {
        mockedAction.mockResolvedValue(null);
        renderForm();

        fireEvent.click(screen.getByRole("button", { name: "登録する" }));

        await waitFor(() => expect(mockedAction).toHaveBeenCalledTimes(1));
        expect(mockedAction.mock.calls[0][1].get("level")).toBe("");
    });

    it("入力エラーで戻ってきても、7項目の入力がフォームに残る", async () => {
        mockedAction.mockImplementation(returnTitleError);
        renderForm();

        fireEvent.change(screen.getByLabelText("タイトル"), { target: { value: "   " } });
        fillAllExceptTitle();
        fireEvent.click(screen.getByRole("button", { name: "登録する" }));

        await screen.findByText("タイトルを入力してください");
        expect(screen.getByLabelText<HTMLInputElement>("タイトル").value).toBe("   ");
        expect(screen.getByLabelText<HTMLSelectElement>("バレル").value).toBe("barrel-2");
        expect(screen.getByLabelText<HTMLSelectElement>("フライト").value).toBe("flight-1");
        expect(screen.getByLabelText<HTMLSelectElement>("シャフト").value).toBe("shaft-1");
        expect(screen.getByLabelText<HTMLSelectElement>("チップ").value).toBe("tip-2");
        expect(screen.getByLabelText<HTMLSelectElement>("対象レベル(任意)").value).toBe("ADVANCED");
        expect(screen.getByLabelText<HTMLTextAreaElement>("特徴・使用感(任意)").value).toBe("テスト");
    });

    it("エラーのある項目に aria-invalid を付け、エラー文言を aria-describedby で関連付ける", async () => {
        mockedAction.mockImplementation(returnTitleError);
        renderForm();

        fireEvent.click(screen.getByRole("button", { name: "登録する" }));

        const message = await screen.findByText("タイトルを入力してください");
        const title = screen.getByLabelText("タイトル");
        expect(title.getAttribute("aria-invalid")).toBe("true");
        expect(title.getAttribute("aria-describedby")).toBe(message.id);
    });

    it("対象レベルのエラーも、ほかの項目と同じく select の下に表示して関連付ける", async () => {
        mockedAction.mockImplementation((_prevState, formData) =>
            Promise.resolve({
                fieldErrors: { level: "対象レベルの選択が正しくありません" },
                values: Object.fromEntries(formData) as SettingFormValues,
            })
        );
        renderForm();

        fireEvent.click(screen.getByRole("button", { name: "登録する" }));

        const message = await screen.findByText("対象レベルの選択が正しくありません");
        const level = screen.getByLabelText("対象レベル(任意)");
        expect(level.id).toBe("setting-level");
        expect(message.id).toBe("setting-level-error");
        expect(level.getAttribute("aria-invalid")).toBe("true");
        expect(level.getAttribute("aria-describedby")).toBe(message.id);
    });

    it("送信中は送信ボタンを無効にし、完了したら戻す", async () => {
        let finish: (state: SettingFormActionState) => void = () => {};
        mockedAction.mockImplementation(
            () => new Promise<SettingFormActionState>((resolve) => {
                finish = resolve;
            })
        );
        renderForm();

        fireEvent.click(screen.getByRole("button", { name: "登録する" }));

        const pendingButton = await screen.findByRole("button", { name: "登録中..." });
        expect(pendingButton).toBeDisabled();

        finish(null);
        await waitFor(() => {
            expect(screen.getByRole("button", { name: "登録する" })).toBeEnabled();
        });
    });

    describe("編集(defaultValues あり)", () => {
        it("7項目に初期値を表示し、ボタンの文言を差し替える", () => {
            renderEditForm();

            expect(screen.getByLabelText<HTMLInputElement>("タイトル").value).toBe("編集前のセッティング");
            expect(screen.getByLabelText<HTMLSelectElement>("バレル").value).toBe("barrel-2");
            expect(screen.getByLabelText<HTMLSelectElement>("フライト").value).toBe("flight-2");
            expect(screen.getByLabelText<HTMLSelectElement>("チップ").value).toBe("tip-2");
            expect(screen.getByLabelText<HTMLSelectElement>("対象レベル(任意)").value).toBe("INTERMEDIATE");
            expect(screen.getByLabelText<HTMLTextAreaElement>("特徴・使用感(任意)").value).toBe("編集前の使用感");
            expect(screen.getByRole("button", { name: "更新する" })).toBeInTheDocument();
        });

        it("初期表示では、フライトの選択によるシャフトのリセットが働かず、shaftId が残る", () => {
            renderEditForm();

            expect(screen.getByLabelText<HTMLSelectElement>("シャフト").value).toBe("shaft-2");
        });

        it("初期値のまま送信すると、初期値で action を呼び出す", async () => {
            mockedAction.mockResolvedValue(null);
            renderEditForm();

            fireEvent.click(screen.getByRole("button", { name: "更新する" }));

            await waitFor(() => expect(mockedAction).toHaveBeenCalledTimes(1));
            const [, formData] = mockedAction.mock.calls[0];
            // 画像の入力欄が無い(imageUploadAction を渡していない)ため、画像は送らない
            const editFields: Partial<SettingFormValues> = { ...editValues };
            delete editFields.imageKey;
            expect(Object.fromEntries(formData)).toEqual(editFields);
        });

        it("対象レベルが未設定(初期値が空文字)なら「選択しない」を表示し、そのまま送ると空文字で送る", async () => {
            mockedAction.mockResolvedValue(null);
            render(
                <SettingForm
                    action={mockedAction}
                    defaultValues={{ ...editValues, level: "" }}
                    submitLabel="更新する"
                    barrels={barrels}
                    shafts={shafts}
                    flights={flights}
                    tips={tips}
                />
            );

            const level = screen.getByLabelText<HTMLSelectElement>("対象レベル(任意)");
            expect(level.value).toBe("");
            expect(level.selectedOptions[0].text).toBe("選択しない");

            fireEvent.click(screen.getByRole("button", { name: "更新する" }));

            await waitFor(() => expect(mockedAction).toHaveBeenCalledTimes(1));
            expect(mockedAction.mock.calls[0][1].get("level")).toBe("");
        });

        it("action がメッセージを返したら、フォームの上部に表示し、入力値を残す", async () => {
            mockedAction.mockImplementation((_prevState, formData) =>
                Promise.resolve({
                    fieldErrors: {},
                    values: Object.fromEntries(formData) as SettingFormValues,
                    message: "セッティングが見つかりません。すでに削除されている可能性があります",
                })
            );
            renderEditForm();

            fireEvent.change(screen.getByLabelText("タイトル"), { target: { value: "変更後のタイトル" } });
            fireEvent.click(screen.getByRole("button", { name: "更新する" }));

            expect(await screen.findByRole("alert")).toHaveTextContent(
                "セッティングが見つかりません。すでに削除されている可能性があります"
            );
            expect(screen.getByLabelText<HTMLInputElement>("タイトル").value).toBe("変更後のタイトル");
            expect(screen.getByLabelText<HTMLSelectElement>("シャフト").value).toBe("shaft-2");
            expect(screen.getByLabelText<HTMLSelectElement>("対象レベル(任意)").value).toBe("INTERMEDIATE");
        });
    });
});

describe("SettingForm の画像", () => {
    const IMAGE_KEY = "settings/user-1/123e4567-e89b-42d3-a456-426614174000.png";
    const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52]);
    const uploadSuccess: SettingImageUploadResult = {
        status: "success",
        upload: {
            url: "http://localhost:9090/yakurabe-dev",
            fields: { key: IMAGE_KEY, "Content-Type": "image/png", Policy: "policy" },
            key: IMAGE_KEY,
        },
    };
    const fetchMock = vi.fn<typeof fetch>();

    beforeEach(() => {
        mockedAction.mockReset();
        mockedUploadAction.mockReset();
        fetchMock.mockReset();
        vi.stubGlobal("fetch", fetchMock);
        return () => vi.unstubAllGlobals();
    });

    function renderImageForm() {
        return render(
            <SettingForm
                action={mockedAction}
                imageUploadAction={mockedUploadAction}
                barrels={barrels}
                shafts={shafts}
                flights={flights}
                tips={tips}
            />
        );
    }

    async function selectImage(file: File) {
        const user = userEvent.setup({ applyAccept: false });
        await user.upload(screen.getByLabelText("画像(任意)"), file);
        return user;
    }

    function fillRequired() {
        fireEvent.change(screen.getByLabelText("タイトル"), { target: { value: "テストセッティング" } });
        fillAllExceptTitle();
    }

    // ブラウザの申告(type)は JPEG だが、中身は PNG
    const pngFile = () => new File([PNG], "photo.jpg", { type: "image/jpeg" });

    it("imageUploadAction を渡さなければ画像の入力欄を表示しない", () => {
        renderForm();
        expect(screen.queryByLabelText("画像(任意)")).not.toBeInTheDocument();
    });

    it("画像を選ぶと、先頭バイトで判定した形式で発行し、S3 に POST してから imageKey 付きで保存の Action を呼ぶ", async () => {
        mockedUploadAction.mockResolvedValue(uploadSuccess);
        fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
        mockedAction.mockResolvedValue(null);
        renderImageForm();
        fillRequired();
        const file = pngFile();
        const user = await selectImage(file);

        await user.click(screen.getByRole("button", { name: "登録する" }));

        await waitFor(() => expect(mockedAction).toHaveBeenCalledTimes(1));
        expect(mockedUploadAction).toHaveBeenCalledWith({ contentType: "image/png", size: file.size });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const body = fetchMock.mock.calls[0][1]?.body as FormData;
        expect(body.get("file")).toBe(file);

        const formData = mockedAction.mock.calls[0][1];
        expect(formData.get("imageKey")).toBe(IMAGE_KEY);
        // ファイル本体は保存の Action に送らない
        expect(formData.has("image")).toBe(false);
    });

    it("画像を選ばなければ、発行も POST もせずに保存の Action を呼ぶ", async () => {
        mockedAction.mockResolvedValue(null);
        renderImageForm();
        fillRequired();

        fireEvent.click(screen.getByRole("button", { name: "登録する" }));

        await waitFor(() => expect(mockedAction).toHaveBeenCalledTimes(1));
        expect(mockedUploadAction).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
        const formData = mockedAction.mock.calls[0][1];
        expect(formData.has("imageKey")).toBe(false);
        expect(formData.has("image")).toBe(false);
    });

    it("画像でないファイルなら、どこにも送らずに形式のエラーを表示する", async () => {
        renderImageForm();
        fillRequired();
        const user = await selectImage(new File(["<!doctype html>"], "x.png", { type: "image/png" }));

        await user.click(screen.getByRole("button", { name: "登録する" }));

        expect(await screen.findByText("JPEG・PNG・WebP の画像を選択してください")).toBeInTheDocument();
        expect(screen.getByLabelText("画像(任意)")).toHaveAttribute("aria-invalid", "true");
        expect(mockedUploadAction).not.toHaveBeenCalled();
        expect(mockedAction).not.toHaveBeenCalled();
    });

    it("5MB を超えるファイルなら、どこにも送らずにサイズのエラーを表示する", async () => {
        renderImageForm();
        fillRequired();
        const big = new Uint8Array(5 * 1024 * 1024 + 1);
        big.set(PNG);
        const user = await selectImage(new File([big], "big.png", { type: "image/png" }));

        await user.click(screen.getByRole("button", { name: "登録する" }));

        expect(await screen.findByText("画像は 5MB 以下にしてください")).toBeInTheDocument();
        expect(mockedUploadAction).not.toHaveBeenCalled();
        expect(mockedAction).not.toHaveBeenCalled();
    });

    it("発行の Action が invalid を返したら、そのメッセージを表示して保存しない", async () => {
        mockedUploadAction.mockResolvedValue({ status: "invalid", message: "画像は 5MB 以下にしてください" });
        renderImageForm();
        fillRequired();
        const user = await selectImage(pngFile());

        await user.click(screen.getByRole("button", { name: "登録する" }));

        expect(await screen.findByText("画像は 5MB 以下にしてください")).toBeInTheDocument();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(mockedAction).not.toHaveBeenCalled();
    });

    it("S3 への POST が失敗したら、アップロード失敗のエラーを表示して保存せず、選択したファイルは残す", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        mockedUploadAction.mockResolvedValue(uploadSuccess);
        fetchMock.mockResolvedValue(new Response("AccessDenied", { status: 403 }));
        renderImageForm();
        fillRequired();
        const user = await selectImage(pngFile());

        await user.click(screen.getByRole("button", { name: "登録する" }));

        expect(
            await screen.findByText("画像のアップロードに失敗しました。時間をおいて再度お試しください")
        ).toBeInTheDocument();
        expect(mockedAction).not.toHaveBeenCalled();
        expect(screen.getByLabelText<HTMLInputElement>("画像(任意)").files).toHaveLength(1);
        consoleError.mockRestore();
    });

    it("発行の Action が例外を投げても、アップロード失敗のエラーを表示する", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        mockedUploadAction.mockRejectedValue(new Error("Failed to fetch"));
        renderImageForm();
        fillRequired();
        const user = await selectImage(pngFile());

        await user.click(screen.getByRole("button", { name: "登録する" }));

        expect(
            await screen.findByText("画像のアップロードに失敗しました。時間をおいて再度お試しください")
        ).toBeInTheDocument();
        expect(mockedAction).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });

    it("未ログイン(unauthenticated)なら、画像なしで保存の Action を呼ぶ(そちらがログイン画面へ送る)", async () => {
        mockedUploadAction.mockResolvedValue({ status: "unauthenticated" });
        mockedAction.mockResolvedValue(null);
        renderImageForm();
        fillRequired();
        const user = await selectImage(pngFile());

        await user.click(screen.getByRole("button", { name: "登録する" }));

        await waitFor(() => expect(mockedAction).toHaveBeenCalledTimes(1));
        expect(fetchMock).not.toHaveBeenCalled();
        expect(mockedAction.mock.calls[0][1].has("imageKey")).toBe(false);
    });

    it("アップロード中も送信ボタンを無効にする", async () => {
        let finishUpload: (result: SettingImageUploadResult) => void = () => {};
        mockedUploadAction.mockImplementation(
            () => new Promise((resolve) => {
                finishUpload = resolve;
            })
        );
        fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
        mockedAction.mockResolvedValue(null);
        renderImageForm();
        fillRequired();
        const user = await selectImage(pngFile());

        await user.click(screen.getByRole("button", { name: "登録する" }));

        expect(await screen.findByRole("button", { name: "登録中..." })).toBeDisabled();
        finishUpload(uploadSuccess);
        await waitFor(() => expect(mockedAction).toHaveBeenCalledTimes(1));
    });

    it("サーバーから画像のエラーが返ったら表示し、次の送信でアップロードし直す", async () => {
        mockedUploadAction.mockResolvedValue(uploadSuccess);
        fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
        mockedAction.mockResolvedValueOnce({
            fieldErrors: { imageKey: "画像を確認できませんでした。もう一度選択してください" },
            values: { ...editValues, imageKey: "" },
        });
        mockedAction.mockResolvedValueOnce(null);
        renderImageForm();
        fillRequired();
        const user = await selectImage(pngFile());

        await user.click(screen.getByRole("button", { name: "登録する" }));
        expect(await screen.findByText("画像を確認できませんでした。もう一度選択してください")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "登録する" }));
        await waitFor(() => expect(mockedAction).toHaveBeenCalledTimes(2));
        expect(mockedUploadAction).toHaveBeenCalledTimes(2);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});

describe("SettingForm の送信失敗", () => {
    beforeEach(() => {
        mockedAction.mockReset();
    });

    it("保存の Action が例外を投げたら、error.tsx に飛ばさずフォームの上部にエラーを表示し、入力を残す", async () => {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
        mockedAction.mockRejectedValue(new Error("An error occurred in the Server Components render"));
        renderForm();
        fireEvent.change(screen.getByLabelText("タイトル"), { target: { value: "テストセッティング" } });
        fillAllExceptTitle();

        fireEvent.click(screen.getByRole("button", { name: "登録する" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "送信に失敗しました。時間をおいて再度お試しください"
        );
        expect(screen.getByLabelText<HTMLInputElement>("タイトル").value).toBe("テストセッティング");
        expect(screen.getByRole("button", { name: "登録する" })).toBeEnabled();
        consoleError.mockRestore();
    });
});
