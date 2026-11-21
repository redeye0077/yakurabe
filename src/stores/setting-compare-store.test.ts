import { describe, it, expect, beforeEach } from "vitest";
import { useSettingCompareStore } from "@/stores/setting-compare-store";

const A = { id: "setting-a", title: "セッティングA" };
const B = { id: "setting-b", title: "セッティングB" };
const C = { id: "setting-c", title: "セッティングC" };

function selected() {
    return useSettingCompareStore.getState().selected;
}

beforeEach(() => {
    useSettingCompareStore.setState(useSettingCompareStore.getInitialState(), true);
});

describe("useSettingCompareStore", () => {
    it("初期状態では何も選んでいない", () => {
        expect(selected()).toEqual([]);
    });

    it("toggle で選んだ順に追加する", () => {
        useSettingCompareStore.getState().toggle(B);
        useSettingCompareStore.getState().toggle(A);

        expect(selected()).toEqual([B, A]);
    });

    it("選択中のものを toggle すると外れる", () => {
        useSettingCompareStore.getState().toggle(A);
        useSettingCompareStore.getState().toggle(B);
        useSettingCompareStore.getState().toggle(A);

        expect(selected()).toEqual([B]);
    });

    it("2件選んでいるときは3件目を追加しない", () => {
        useSettingCompareStore.getState().toggle(A);
        useSettingCompareStore.getState().toggle(B);
        useSettingCompareStore.getState().toggle(C);

        expect(selected()).toEqual([A, B]);
    });

    it("2件のうち1件を外せば、別のものを追加できる", () => {
        useSettingCompareStore.getState().toggle(A);
        useSettingCompareStore.getState().toggle(B);
        useSettingCompareStore.getState().remove(A.id);
        useSettingCompareStore.getState().toggle(C);

        expect(selected()).toEqual([B, C]);
    });

    it("remove で指定した id だけを外す。選んでいない id なら何も変えない", () => {
        useSettingCompareStore.getState().toggle(A);
        useSettingCompareStore.getState().toggle(B);

        useSettingCompareStore.getState().remove("setting-x");
        expect(selected()).toEqual([A, B]);

        useSettingCompareStore.getState().remove(B.id);
        expect(selected()).toEqual([A]);
    });

    it("clear ですべて外す", () => {
        useSettingCompareStore.getState().toggle(A);
        useSettingCompareStore.getState().toggle(B);
        useSettingCompareStore.getState().clear();

        expect(selected()).toEqual([]);
    });
});
