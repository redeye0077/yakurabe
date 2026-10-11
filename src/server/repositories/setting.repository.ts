import type { Tag } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type UpsertSettingInput = {
  userId: string;
  title: string;
  description: string;
  imageUrl: string | null;
  tag: Tag;
  barrelId: string;
  shaftId: string | null;
  flightId: string;
  tipId: string;
  createdAt: Date;
};

export const SettingRepository = {
  // Seedで固定idを使って登録するため、同じidがあれば更新する
  async upsert(id: string, data: UpsertSettingInput) {
    return prisma.setting.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  },
};
