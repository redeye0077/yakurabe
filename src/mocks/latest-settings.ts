// 新着セッティングの仮データ。Service層ができたら getLatestSettings() の呼び出し元を差し替える
import type { SettingSummary } from "@/server/dto/setting.dto";

const latestSettings: SettingSummary[] = [
  {
    id: "mock-1",
    title: "初心者におすすめ!安定重視セッティング",
    userName: "Kazuya",
    totalWeight: 21.5,
    imageUrl: null,
  },
  {
    id: "mock-2",
    title: "コスパ重視セッティング",
    userName: "Sora",
    totalWeight: 20.0,
    imageUrl: null,
  },
  {
    id: "mock-3",
    title: "軽量バランス重視セッティング",
    userName: "Taku",
    totalWeight: 18.5,
    imageUrl: null,
  },
  {
    id: "mock-4",
    title: "飛び重視ストレートセッティング",
    userName: "Haruki",
    totalWeight: 22.0,
    imageUrl: null,
  },
];

export async function getLatestSettings(): Promise<SettingSummary[]> {
  return latestSettings;
}
