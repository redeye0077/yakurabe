import { prisma } from "@/lib/prisma";
import { CreateBarrelInput } from "@/schemas/barrel";

export const BarrelRepository = {
  async findByNameContains(query: string) {
    return prisma.barrel.findMany({
      where: {
        name: { contains: query },
      },
      orderBy: { name: "asc" },
    });
  },

  async create(data: CreateBarrelInput) {
    return prisma.barrel.create({ data });
  },
};
