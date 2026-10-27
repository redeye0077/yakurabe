import {
  CreateSettingRecordInput,
  SettingListItemRecord,
  SettingRepository,
  UpsertSettingInput,
} from "@/server/repositories/setting.repository";
import { BarrelRepository } from "@/server/repositories/barrel.repository";
import { ShaftRepository } from "@/server/repositories/shaft.repository";
import { FlightRepository } from "@/server/repositories/flight.repository";
import { TipRepository } from "@/server/repositories/tip.repository";
import { SettingListItemDto } from "@/server/dto/setting.dto";
import { SettingNotFoundError, SettingRuleError } from "@/server/errors/setting.error";
import { calcTotalPrice } from "@/lib/setting-price";

// 登録フォームから受け取る入力。投稿者はセッションから決め、画像はこのフェーズでは扱わない
export type CreateSettingServiceInput = Omit<CreateSettingRecordInput, "userId" | "imageUrl">;

type SettingProductIds = Pick<CreateSettingRecordInput, "barrelId" | "shaftId" | "flightId" | "tipId">;

// 一覧カード用のDTOに変換する。合計価格は保存していないので、ここで算出する
function toListItemDto(setting: SettingListItemRecord): SettingListItemDto {
  return {
    id: setting.id,
    title: setting.title,
    imageUrl: setting.imageUrl,
    barrelName: setting.barrel.name,
    shaftName: setting.shaft?.name ?? null,
    flightName: setting.flight.name,
    tipName: setting.tip.name,
    barrelWeight: setting.barrel.weight,
    totalPrice: calcTotalPrice(setting),
    userName: setting.user.username,
    createdAt: setting.createdAt.toISOString(),
  };
}

/**
 * 選んだ商品の組み合わせが業務ルールを満たすか検証する。違反していれば SettingRuleError を throw する。
 * ① 選んだ商品がすべて存在する
 * ② シャフトとフライトの規格(flightSystem)が一致する
 * ③ 一体型フライトならシャフトは選ばない(null)。一体型でなければシャフトは必須
 * ②は一体型でないときだけ判定するため、③を先に確認する
 */
async function assertValidProducts(ids: SettingProductIds): Promise<void> {
  const [barrel, flight, tip, shaft] = await Promise.all([
    BarrelRepository.findById(ids.barrelId),
    FlightRepository.findById(ids.flightId),
    TipRepository.findById(ids.tipId),
    ids.shaftId === null ? null : ShaftRepository.findById(ids.shaftId),
  ]);

  if (!barrel) {
    throw new SettingRuleError("barrelId", "選択したバレルが見つかりません");
  }
  if (!flight) {
    throw new SettingRuleError("flightId", "選択したフライトが見つかりません");
  }
  if (!tip) {
    throw new SettingRuleError("tipId", "選択したチップが見つかりません");
  }
  if (ids.shaftId !== null && !shaft) {
    throw new SettingRuleError("shaftId", "選択したシャフトが見つかりません");
  }

  // 一体型はシャフト部分ごと交換するため、シャフトを組み合わせない
  if (flight.flightType === "SHAFT_INTEGRATED") {
    if (ids.shaftId !== null) {
      throw new SettingRuleError("shaftId", "シャフト一体型フライトにはシャフトを選択できません");
    }
    return;
  }

  if (!shaft) {
    throw new SettingRuleError("shaftId", "シャフトを選択してください");
  }
  // 規格が違うと物理的に組み合わせられない
  if (shaft.flightSystem !== flight.flightSystem) {
    throw new SettingRuleError("shaftId", "選択したフライトと規格が合わないシャフトです");
  }
}

export const SettingService = {
  // 一覧・トップの新着用。limit を省略すると全件を返す
  async listLatest(options: { limit?: number } = {}): Promise<SettingListItemDto[]> {
    const settings = await SettingRepository.findLatest(options.limit);

    return settings.map(toListItemDto);
  },

  // マイページ用。指定したユーザーの投稿を新着順で全件返す
  async listByUser(options: { userId: string }): Promise<SettingListItemDto[]> {
    const settings = await SettingRepository.findByUserId(options.userId);

    return settings.map(toListItemDto);
  },

  // 登録フォームからの新規作成。商品の組み合わせを検証してから保存し、作成したセッティングのidを返す
  async create(userId: string, input: CreateSettingServiceInput): Promise<{ id: string }> {
    await assertValidProducts(input);

    return SettingRepository.create({ ...input, userId, imageUrl: null });
  },

  // 自分の投稿の削除。対象が無い場合と他人の投稿の場合は、区別せず SettingNotFoundError を throw する
  async delete(userId: string, id: string): Promise<void> {
    const setting = await SettingRepository.findOwnerById(id);
    if (!setting || setting.userId !== userId) {
      throw new SettingNotFoundError();
    }

    // 確認してから削除するまでの間に、別の操作で削除された場合
    const deleted = await SettingRepository.delete(id, userId);
    if (!deleted) {
      throw new SettingNotFoundError();
    }
  },

  // Seed専用。APIからは公開しない。Seedを再実行しても重複しないよう固定idでupsertする
  // 登録フォームと同じ業務ルールで検証し、Seed のデータの誤りにも気づけるようにする
  async upsert(id: string, data: UpsertSettingInput) {
    await assertValidProducts(data);

    return SettingRepository.upsert(id, data);
  },
};
