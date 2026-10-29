// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingForm } from "@/components/features/setting/setting-form";
import type { SettingFormActionState, SettingFormValues } from "@/types/setting-form";
import type { BarrelListItemDto } from "@/server/dto/barrel.dto";
import type { ShaftListItemDto } from "@/server/dto/shaft.dto";
import type { FlightListItemDto } from "@/server/dto/flight.dto";
import type { TipListItemDto } from "@/server/dto/tip.dto";

const mockedAction = vi.fn<(prevState: SettingFormActionState, formData: FormData) => Promise<SettingFormActionState>>();

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
    description: "編集前の使用感",
    barrelId: "barrel-2",
    shaftId: "shaft-2",
    flightId: "flight-2",
    tipId: "tip-2",
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
            description: str("description"),
            barrelId: str("barrelId"),
            shaftId: str("shaftId"),
            flightId: str("flightId"),
            tipId: str("tipId"),
        },
    });
}

function fillAllExceptTitle() {
    fireEvent.change(screen.getByLabelText("バレル"), { target: { value: "barrel-2" } });
    fireEvent.change(screen.getByLabelText("フライト"), { target: { value: "flight-1" } });
    fireEvent.change(screen.getByLabelText("シャフト"), { target: { value: "shaft-1" } });
    fireEvent.change(screen.getByLabelText("チップ"), { target: { value: "tip-2" } });
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
        });
    });

    it("入力エラーで戻ってきても、6項目の入力がフォームに残る", async () => {
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
        it("6項目に初期値を表示し、ボタンの文言を差し替える", () => {
            renderEditForm();

            expect(screen.getByLabelText<HTMLInputElement>("タイトル").value).toBe("編集前のセッティング");
            expect(screen.getByLabelText<HTMLSelectElement>("バレル").value).toBe("barrel-2");
            expect(screen.getByLabelText<HTMLSelectElement>("フライト").value).toBe("flight-2");
            expect(screen.getByLabelText<HTMLSelectElement>("チップ").value).toBe("tip-2");
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
            expect(Object.fromEntries(formData)).toEqual(editValues);
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
        });
    });
});
