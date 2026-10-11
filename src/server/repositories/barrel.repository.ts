import { prisma } from "@/lib/prisma";
import { CreateBarrelInput } from "@/schemas/barrel";

export const BarrelRepository = {
  async findAll() {
    return prisma.barrel.findMany({
      // 同名の商品があっても表示順が揺れないよう、idで順序を確定させる
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  },

  // Seedで固定idを使って登録するため、同じidがあれば更新する
  async upsert(id: string, data: CreateBarrelInput) {
    return prisma.barrel.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  },
};
