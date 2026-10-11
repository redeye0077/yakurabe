import { BarrelRepository } from "@/server/repositories/barrel.repository";
import { BarrelListItemDto } from "@/server/dto/barrel.dto";
import { CreateBarrelInput } from "@/schemas/barrel";

export const BarrelService = {
  /**
   * セッティング登録フォームのCombobox用に全件を返す。
   * 商品はSeedでのみ管理していて件数が増えないため、絞り込みは画面側で行う。
   */
  async listAll(): Promise<BarrelListItemDto[]> {
    const barrels = await BarrelRepository.findAll();

    return barrels.map((barrel) => ({
      id: barrel.id,
      name: barrel.name,
      price: barrel.price,
      weight: barrel.weight,
    }));
  },

  // Seed専用。APIからは公開しない。Seedを再実行しても重複しないよう固定idでupsertする
  async upsert(id: string, data: CreateBarrelInput) {
    return BarrelRepository.upsert(id, data);
  },
};
