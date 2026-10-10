import { prisma } from "@/lib/prisma";
import { CreateShaftInput } from "@/schemas/shaft";

export const ShaftRepository = {
  async findAll() {
    return prisma.shaft.findMany({
      // 同名の商品があっても表示順が揺れないよう、idで順序を確定させる
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  },

  async create(data: CreateShaftInput) {
    return prisma.shaft.create({ data });
  },
};
