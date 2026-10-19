import { prisma } from "@/lib/prisma";
import { CreateTipInput } from "@/schemas/tip";

export const TipRepository = {
  async findAll() {
    return prisma.tip.findMany({
      // 同名の商品があっても表示順が揺れないよう、idで順序を確定させる
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  },

  // セッティング登録時に、選んだチップが存在するかの確認に使う。無ければ null を返す
  async findById(id: string) {
    return prisma.tip.findUnique({
      where: { id },
      select: { id: true },
    });
  },

  // Seedで固定idを使って登録するため、同じidがあれば更新する
  async upsert(id: string, data: CreateTipInput) {
    return prisma.tip.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  },
};
