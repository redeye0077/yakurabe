import { SettingRepository, UpsertSettingInput } from "@/server/repositories/setting.repository";
import { SettingListItemDto } from "@/server/dto/setting.dto";
import { calcTotalPrice } from "@/lib/setting-price";

export const SettingService = {
  // 一覧・トップの新着用。limit を省略すると全件を返す
  async listLatest(options: { limit?: number } = {}): Promise<SettingListItemDto[]> {
    const settings = await SettingRepository.findLatest(options.limit);

    return settings.map((setting) => ({
      id: setting.id,
      title: setting.title,
      imageUrl: setting.imageUrl,
      barrelName: setting.barrel.name,
      shaftName: setting.shaft?.name ?? null,
      flightName: setting.flight.name,
      tipName: setting.tip.name,
      barrelWeight: setting.barrel.weight,
      totalPrice: calcTotalPrice(setting),
      userName: setting.user.username,
      createdAt: setting.createdAt.toISOString(),
    }));
  },

  // Seed専用。APIからは公開しない。Seedを再実行しても重複しないよう固定idでupsertする
  // TODO: 登録フェーズで、シャフトとフライトの flightSystem 一致と、一体型フライトなら shaftId が null であることの
  //       検証を追加する(現状は Seed のデータを手で正しく書くことで担保している)
  async upsert(id: string, data: UpsertSettingInput) {
    return SettingRepository.upsert(id, data);
  },
};
