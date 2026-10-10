import { ShaftRepository } from "@/server/repositories/shaft.repository";
import { ShaftListItemDto } from "@/server/dto/shaft.dto";
import { CreateShaftInput } from "@/schemas/shaft";

export const ShaftService = {
  /**
   * セッティング登録フォームのCombobox用に全件を返す。
   * 商品はSeedでのみ管理していて件数が増えないため、絞り込みは画面側で行う。
   */
  async listAll(): Promise<ShaftListItemDto[]> {
    const shafts = await ShaftRepository.findAll();

    return shafts.map((shaft) => ({
      id: shaft.id,
      name: shaft.name,
      price: shaft.price,
    }));
  },

  // Seed専用。APIからは公開しない。
  async create(data: CreateShaftInput) {
    return ShaftRepository.create(data);
  },
};
