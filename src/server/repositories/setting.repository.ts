import type { Prisma, Tag } from "@prisma/client";
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

// 一覧カードの表示に必要な項目。新着一覧とマイページで共通に使う
const settingListItemSelect = {
  id: true,
  title: true,
  imageUrl: true,
  createdAt: true,
  user: { select: { username: true } },
  barrel: { select: { name: true, weight: true, price: true } },
  shaft: { select: { name: true, price: true } },
  flight: { select: { name: true, price: true } },
  tip: { select: { name: true, price: true } },
} satisfies Prisma.SettingSelect;

export const SettingRepository = {
  // 新着順。take を省略すると全件を返す
  async findLatest(take?: number) {
    return prisma.setting.findMany({
      // 投稿日時が同じでも表示順が揺れないよう、idで順序を確定させる
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      select: settingListItemSelect,
    });
  },

  // Seedで固定idを使って登録するため、同じidがあれば更新する
  async upsert(id: string, data: UpsertSettingInput) {
    return prisma.setting.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  },
};
