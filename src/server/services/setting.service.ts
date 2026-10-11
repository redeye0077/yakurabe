import { SettingRepository, UpsertSettingInput } from "@/server/repositories/setting.repository";

export const SettingService = {
  // Seed専用。APIからは公開しない。Seedを再実行しても重複しないよう固定idでupsertする
  // TODO: 登録フェーズで、シャフトとフライトの flightSystem 一致と、一体型フライトなら shaftId が null であることの
  //       検証を追加する(現状は Seed のデータを手で正しく書くことで担保している)
  async upsert(id: string, data: UpsertSettingInput) {
    return SettingRepository.upsert(id, data);
  },
};
