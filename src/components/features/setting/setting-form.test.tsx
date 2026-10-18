// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingForm } from "@/components/features/setting/setting-form";
import type { CreateSettingActionState } from "@/app/(main)/settings/new/actions";
import type { BarrelListItemDto } from "@/server/dto/barrel.dto";
import type { ShaftListItemDto } from "@/server/dto/shaft.dto";
import type { FlightListItemDto } from "@/server/dto/flight.dto";
import type { TipListItemDto } from "@/server/dto/tip.dto";

const { mockedCreateSettingAction } = vi.hoisted(() => ({
    mockedCreateSettingAction: vi.fn<(prevState: CreateSettingActionState, formData: FormData) => Promise<CreateSettingActionState>>(),
}));

vi.mock("@/app/(main)/settings/new/actions", () => ({
    createSettingAction: mockedCreateSettingAction,
}));

const barrels: BarrelListItemDto[] = [
    { id: "barrel-1", name: "テストバレルA", price: 17600, weight: 18 },
    { id: "barrel-2", name: "テストバレルB", price: 19800, weight: 20.5 },
];
const shafts: ShaftListItemDto[] = [
    { id: "shaft-1", name: "テストシャフト", price: 500, flightSystem: "UNIVERSAL" },
];
const flights: FlightListItemDto[] = [
    { id: "flight-1", name: "テストフライト", price: 1080, flightType: "MOLDED", flightSystem: "UNIVERSAL" },
];
const tips: TipListItemDto[] = [
    { id: "tip-1", name: "テストチップA", price: 770 },
    { id: "tip-2", name: "テストチップB", price: 880 },
];

function renderForm() {
    return render(<SettingForm barrels={barrels} shafts={shafts} flights={flights} tips={tips} />);
}

// 送信された入力をそのまま values に詰めて、タイトルの入力エラーとして返す
function returnTitleError(_prevState: CreateSettingActionState, formData: FormData): Promise<CreateSettingActionState> {
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
        mockedCreateSettingAction.mockReset();
    });

    it("入力エラーで戻ってきても、6項目の入力がフォームに残る", async () => {
        mockedCreateSettingAction.mockImplementation(returnTitleError);
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
        mockedCreateSettingAction.mockImplementation(returnTitleError);
        renderForm();

        fireEvent.click(screen.getByRole("button", { name: "登録する" }));

        const message = await screen.findByText("タイトルを入力してください");
        const title = screen.getByLabelText("タイトル");
        expect(title.getAttribute("aria-invalid")).toBe("true");
        expect(title.getAttribute("aria-describedby")).toBe(message.id);
    });

    it("送信中は送信ボタンを無効にし、完了したら戻す", async () => {
        let finish: (state: CreateSettingActionState) => void = () => {};
        mockedCreateSettingAction.mockImplementation(
            () => new Promise<CreateSettingActionState>((resolve) => {
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
});
