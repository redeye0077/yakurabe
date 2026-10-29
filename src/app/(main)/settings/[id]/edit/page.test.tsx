// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import EditSettingPage from "@/app/(main)/settings/[id]/edit/page";
import { SettingController } from "@/server/controllers/setting.controller";
import { BarrelService } from "@/server/services/barrel.service";
import { ShaftService } from "@/server/services/shaft.service";
import { FlightService } from "@/server/services/flight.service";
import { TipService } from "@/server/services/tip.service";

// 本物の notFound()・redirect() と同様に例外を投げて処理を止める
class NotFoundSignal extends Error {}
class RedirectSignal extends Error {
    constructor(public readonly url: string) {
        super(`redirect:${url}`);
    }
}

const { mockedAuth } = vi.hoisted(() => ({
    mockedAuth: vi.fn<() => Promise<{ user?: { id?: string } } | null>>(),
}));

vi.mock("@/lib/auth", () => ({
    auth: mockedAuth,
}));

vi.mock("next/server", () => ({
    connection: vi.fn(() => Promise.resolve()),
}));

vi.mock("next/navigation", () => ({
    notFound: vi.fn(() => {
        throw new NotFoundSignal();
    }),
    redirect: vi.fn((url: string) => {
        throw new RedirectSignal(url);
    }),
}));

vi.mock("@/app/(main)/settings/[id]/edit/actions", () => ({
    updateSettingAction: vi.fn(),
}));

vi.mock("@/server/controllers/setting.controller", () => ({
    SettingController: { getForEdit: vi.fn() },
}));
vi.mock("@/server/services/barrel.service", () => ({
    BarrelService: { listAll: vi.fn() },
}));
vi.mock("@/server/services/shaft.service", () => ({
    ShaftService: { listAll: vi.fn() },
}));
vi.mock("@/server/services/flight.service", () => ({
    FlightService: { listAll: vi.fn() },
}));
vi.mock("@/server/services/tip.service", () => ({
    TipService: { listAll: vi.fn() },
}));

const mockedGetForEdit = vi.mocked(SettingController.getForEdit);

function renderPage(id: string) {
    return EditSettingPage({ params: Promise.resolve({ id }) });
}

beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue({ user: { id: "user-1" } });
    vi.mocked(BarrelService.listAll).mockResolvedValue([
        { id: "barrel-1", name: "テストバレル", price: 17600, weight: 18 },
    ]);
    vi.mocked(ShaftService.listAll).mockResolvedValue([
        { id: "shaft-1", name: "テストシャフト", price: 500, flightSystem: "UNIVERSAL" },
    ]);
    vi.mocked(FlightService.listAll).mockResolvedValue([
        { id: "flight-1", name: "テストフライト", price: 1080, flightType: "MOLDED", flightSystem: "UNIVERSAL" },
    ]);
    vi.mocked(TipService.listAll).mockResolvedValue([
        { id: "tip-1", name: "テストチップ", price: 770 },
    ]);
});

describe("EditSettingPage", () => {
    it("対象が無い・他人の投稿(not_found)なら notFound() を呼び、商品は取得しない", async () => {
        mockedGetForEdit.mockResolvedValue({ status: "not_found" });

        await expect(renderPage("setting-1")).rejects.toBeInstanceOf(NotFoundSignal);
        expect(mockedGetForEdit).toHaveBeenCalledWith("user-1", { id: "setting-1" });
        expect(BarrelService.listAll).not.toHaveBeenCalled();
    });

    it("未ログインなら、ログイン後に編集ページへ戻るようリダイレクトし、取得しない", async () => {
        mockedAuth.mockResolvedValue(null);

        const error = await renderPage("setting-1").catch((e: unknown) => e);

        expect(error).toBeInstanceOf(RedirectSignal);
        expect((error as RedirectSignal).url).toBe(
            `/login?callbackUrl=${encodeURIComponent("/settings/setting-1/edit")}`
        );
        expect(mockedGetForEdit).not.toHaveBeenCalled();
    });

    it("自分の投稿なら、編集前の値を初期値にしたフォームを表示する", async () => {
        mockedGetForEdit.mockResolvedValue({
            status: "success",
            setting: {
                title: "編集前のセッティング",
                description: null,
                barrelId: "barrel-1",
                shaftId: "shaft-1",
                flightId: "flight-1",
                tipId: "tip-1",
            },
        });

        render(await renderPage("setting-1"));

        expect(screen.getByRole("heading", { name: "セッティングを編集" })).toBeInTheDocument();
        expect(screen.getByLabelText<HTMLInputElement>("タイトル").value).toBe("編集前のセッティング");
        expect(screen.getByLabelText<HTMLSelectElement>("シャフト").value).toBe("shaft-1");
        expect(screen.getByLabelText<HTMLTextAreaElement>("特徴・使用感(任意)").value).toBe("");
        expect(screen.getByRole("button", { name: "更新する" })).toBeInTheDocument();
    });
});
