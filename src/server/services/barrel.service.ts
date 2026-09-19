import { BarrelRepository } from "@/server/repositories/barrel.repository";
import { BarrelListItemDto } from "@/server/dto/barrel.dto";
import { CreateBarrelInput } from "@/schemas/barrel";

export const BarrelService = {
  /**
   * 検索付きComboboxの候補取得用。
   * queryが空の場合は候補を出さない仕様のため、DBには問い合わせない。
   */
  async search(query: string | undefined): Promise<BarrelListItemDto[]> {
    if (!query) {
      return [];
    }

    const barrels = await BarrelRepository.findByNameContains(query);

    return barrels.map((barrel) => ({
      id: barrel.id,
      name: barrel.name,
      price: barrel.price,
      weight: barrel.weight,
    }));
  },

  // Seed専用。APIからは公開しない。
  async create(data: CreateBarrelInput) {
    return BarrelRepository.create(data);
  },
};
