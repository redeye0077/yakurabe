import { prisma } from "@/lib/prisma";
import { CreateShaftInput } from "@/schemas/shaft";

export const ShaftRepository = {
  async findAll() {
    return prisma.shaft.findMany({
      // 同名の商品があっても表示順が揺れないよう、idで順序を確定させる
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  },

  // セッティング登録時に、存在確認とフライトとの規格の照合に使う。無ければ null を返す
  async findById(id: string) {
    return prisma.shaft.findUnique({
      where: { id },
      select: { id: true, flightSystem: true },
    });
  },

  // Seedで固定idを使って登録するため、同じidがあれば更新する
  async upsert(id: string, data: CreateShaftInput) {
    return prisma.shaft.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  },
};
