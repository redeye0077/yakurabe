import { prisma } from "@/lib/prisma";
import { CreateFlightInput } from "@/schemas/flight";

export const FlightRepository = {
  async findAll() {
    return prisma.flight.findMany({
      // 同名の商品があっても表示順が揺れないよう、idで順序を確定させる
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  },

  // セッティング登録時に、存在確認と一体型かどうか・規格の判定に使う。無ければ null を返す
  async findById(id: string) {
    return prisma.flight.findUnique({
      where: { id },
      select: { id: true, flightType: true, flightSystem: true },
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
