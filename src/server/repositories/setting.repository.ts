import { Prisma, type SettingLevel as PrismaSettingLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SettingLevel } from "@/schemas/setting-level";

// 自前の SettingLevel(src/schemas/setting-level.ts)と Prisma の enum が同じ値か、双方向で型チェックする。
// 片方にだけ値を足す・消すと、どちらかが false になり typecheck で失敗する(実行時には何もしない)
type OwnLevelsExistInPrisma = SettingLevel extends PrismaSettingLevel ? true : false; // 自前 → Prisma
type PrismaLevelsExistInOwn = PrismaSettingLevel extends SettingLevel ? true : false; // Prisma → 自前
const settingLevelMatchesPrisma: [OwnLevelsExistInPrisma, PrismaLevelsExistInOwn] = [true, true];
void settingLevelMatchesPrisma;

export type UpsertSettingInput = {
  userId: string;
  title: string;
  description: string | null;
  level: SettingLevel | null; // 対象レベル。未設定なら null
  imageKey: string | null; // S3 の保存先キー。表示用 URL は Service で組み立てる
  barrelId: string;
  shaftId: string | null;
  flightId: string;
  tipId: string;
  createdAt: Date;
};

// 登録フォームからの新規作成用。createdAt は DB の既定値(現在時刻)に任せる
export type CreateSettingRecordInput = Omit<UpsertSettingInput, "createdAt">;

// 一覧カードの表示に必要な項目。新着一覧とマイページで共通に使う
const settingListItemSelect = {
  id: true,
  title: true,
  level: true,
  imageKey: true,
  createdAt: true,
  user: { select: { username: true } },
  barrel: { select: { name: true, weight: true, price: true } },
  shaft: { select: { name: true, price: true } },
  flight: { select: { name: true, price: true } },
  tip: { select: { name: true, price: true } },
} satisfies Prisma.SettingSelect;

export type SettingListItemRecord = Prisma.SettingGetPayload<{ select: typeof settingListItemSelect }>;

// 一覧の絞り込み条件。今は条件なし。level・名前検索を足すときは、ここと buildSettingListWhere に追加する
export type SettingListFilter = Record<string, never>;

// 一覧の where を作る。件数(count)と取得(findMany)で同じ条件になるよう、ここだけで組み立てる
function buildSettingListWhere(filter: SettingListFilter): Prisma.SettingWhereInput {
  void filter;
  return {};
}

// 編集フォームの初期値と、編集前の投稿者の確認に必要な項目
const settingEditSelect = {
  userId: true,
  title: true,
  description: true,
  level: true,
  imageKey: true,
  barrelId: true,
  shaftId: true,
  flightId: true,
  tipId: true,
} satisfies Prisma.SettingSelect;

export type SettingEditRecord = Prisma.SettingGetPayload<{ select: typeof settingEditSelect }>;

// 編集フォームからの更新用。投稿者・投稿日時は変更しない。
// imageKey は新しい画像に差し替えるときだけ渡す(渡さなければ既存の画像をそのまま残す。null で外す操作は無い)
export type UpdateSettingRecordInput = Omit<CreateSettingRecordInput, "userId" | "imageKey"> & {
  imageKey?: string;
};

// 更新の結果。not_found は該当なし(P2025)、image_key_taken は imageKey が別のセッティングで使われている(P2002)
export type UpdateSettingRecordResult = "updated" | "not_found" | "image_key_taken";

// imageKey の UNIQUE 制約名(prisma/migrations の CREATE UNIQUE INDEX)
const IMAGE_KEY_UNIQUE_INDEX = "setting_imageKey_key";

/**
 * imageKey の UNIQUE 制約違反(P2002)か。
 * driver adapter(mariadb)経由では meta.target が付かず、meta.driverAdapterError.cause.constraint に
 * 制約名(index)が入るため両方を見る。どちらでも imageKey と判定できなければ false
 */
function isImageKeyUniqueViolation(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") {
    return false;
  }
  const meta: Record<string, unknown> = e.meta ?? {};

  const target = meta.target;
  if (target === "imageKey" || target === IMAGE_KEY_UNIQUE_INDEX) return true;
  if (Array.isArray(target) && target.includes("imageKey")) return true;

  const constraint = getProperty(getProperty(meta.driverAdapterError, "cause"), "constraint");
  if (getProperty(constraint, "index") === IMAGE_KEY_UNIQUE_INDEX) return true;
  const fields = getProperty(constraint, "fields");
  return Array.isArray(fields) && fields.includes("imageKey");
}

function getProperty(value: unknown, key: string): unknown {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>)[key] : undefined;
}

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

  // /settings のページネーション用。条件に合う件数を返す
  async countForList(filter: SettingListFilter): Promise<number> {
    return prisma.setting.count({ where: buildSettingListWhere(filter) });
  },

  // /settings のページネーション用。条件に合うセッティングを新着順(同時刻は id 順)で skip 件飛ばして take 件返す
  async findPaged(filter: SettingListFilter, paging: { skip: number; take: number }) {
    return prisma.setting.findMany({
      where: buildSettingListWhere(filter),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: paging.skip,
      take: paging.take,
      select: settingListItemSelect,
    });
  },

  // マイページ用。指定したユーザーの投稿を新着順で全件返す
  async findByUserId(userId: string) {
    return prisma.setting.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: settingListItemSelect,
    });
  },

  // 削除前の投稿者の確認用。存在しなければ null を返す
  async findOwnerById(id: string) {
    return prisma.setting.findUnique({
      where: { id },
      select: { userId: true },
    });
  },

  // 編集用。存在しなければ null を返す
  async findById(id: string) {
    return prisma.setting.findUnique({
      where: { id },
      select: settingEditSelect,
    });
  },

  // 指定したユーザーの投稿なら物理削除し、削除した行の imageKey を返す(画像の後片付け用)。
  // 該当が無ければ(P2025)null を返す
  async delete(id: string, userId: string): Promise<{ imageKey: string | null } | null> {
    try {
      return await prisma.setting.delete({
        where: { id, userId },
        select: { imageKey: true },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        return null;
      }
      throw e;
    }
  },

  // 指定したユーザーの投稿なら更新する。該当が無ければ(P2025)not_found、
  // imageKey がすでに別のセッティングで使われていれば(P2002)image_key_taken を返す。それ以外のエラーは throw する
  async update(id: string, userId: string, data: UpdateSettingRecordInput): Promise<UpdateSettingRecordResult> {
    try {
      await prisma.setting.update({
        where: { id, userId },
        data,
        select: { id: true },
      });
      return "updated";
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
        return "not_found";
      }
      if (isImageKeyUniqueViolation(e)) {
        return "image_key_taken";
      }
      throw e;
    }
  },

  // 作成したセッティングの id を返す。imageKey がすでに別のセッティングで使われていれば(P2002)null を返す。
  // imageKey 以外の P2002 はそのまま throw する
  async create(data: CreateSettingRecordInput): Promise<{ id: string } | null> {
    try {
      return await prisma.setting.create({
        data,
        select: { id: true },
      });
    } catch (e) {
      if (isImageKeyUniqueViolation(e)) {
        return null;
      }
      throw e;
    }
  },

  // 画像の保存先キーを使っているセッティングがあるか(使用中の画像を消さないための確認)
  async existsByImageKey(imageKey: string): Promise<boolean> {
    const setting = await prisma.setting.findUnique({
      where: { imageKey },
      select: { id: true },
    });
    return setting !== null;
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
