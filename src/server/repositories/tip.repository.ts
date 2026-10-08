import { prisma } from "@/lib/prisma";
import { CreateTipInput } from "@/schemas/tip";

export const TipRepository = {
  async findAll() {
    return prisma.tip.findMany({
      // 同名の商品があっても表示順が揺れないよう、idで順序を確定させる
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  },

  async create(data: CreateTipInput) {
    return prisma.tip.create({ data });
  },
};
