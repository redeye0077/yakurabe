import { TipRepository } from "@/server/repositories/tip.repository";
import { TipListItemDto } from "@/server/dto/tip.dto";
import { CreateTipInput } from "@/schemas/tip";

export const TipService = {
  /**
   * セッティング登録フォームのCombobox用に全件を返す。
   * 商品はSeedでのみ管理していて件数が増えないため、絞り込みは画面側で行う。
   */
  async listAll(): Promise<TipListItemDto[]> {
    const tips = await TipRepository.findAll();

    return tips.map((tip) => ({
      id: tip.id,
      name: tip.name,
      price: tip.price,
    }));
  },

  // Seed専用。APIからは公開しない。
  async create(data: CreateTipInput) {
    return TipRepository.create(data);
  },
};
