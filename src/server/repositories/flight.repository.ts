import { prisma } from "@/lib/prisma";
import { CreateFlightInput } from "@/schemas/flight";

export const FlightRepository = {
  async findAll() {
    return prisma.flight.findMany({
      // 同名の商品があっても表示順が揺れないよう、idで順序を確定させる
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  },

  // Seedで固定idを使って登録するため、同じidがあれば更新する
  async upsert(id: string, data: CreateFlightInput) {
    return prisma.flight.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  },
};
