import {
  CreateSettingRecordInput,
  SettingListItemRecord,
  SettingRepository,
  UpdateSettingRecordInput,
  UpdateSettingRecordResult,
  UpsertSettingInput,
} from "@/server/repositories/setting.repository";
import { BarrelRepository } from "@/server/repositories/barrel.repository";
import { ShaftRepository } from "@/server/repositories/shaft.repository";
import { FlightRepository } from "@/server/repositories/flight.repository";
import { TipRepository } from "@/server/repositories/tip.repository";
import { SettingEditDto, SettingImageUploadDto, SettingListItemDto } from "@/server/dto/setting.dto";
import {
  SettingImageError,
  SettingNotFoundError,
  SettingRuleError,
} from "@/server/errors/setting.error";
import { ValidationError } from "@/server/errors/validation.error";
import { calcTotalPrice } from "@/lib/setting-price";
import {
  buildSettingImageKey,
  detectImageType,
  isOwnSettingImageKey,
  parseSettingImageKey,
  SETTING_IMAGE_MAX_BYTES,
  SETTING_IMAGE_SIZE_MESSAGE,
  SETTING_IMAGE_TYPE_MESSAGE,
  type SettingImageType,
} from "@/lib/setting-image";
import { getObjectStorage } from "@/server/storage/get-object-storage";

// 登録フォームから受け取る入力。投稿者はセッションから決める。imageKey は画面が S3 にアップロードした画像のキー(任意)
export type CreateSettingServiceInput = Omit<CreateSettingRecordInput, "userId">;

// 編集フォームから受け取る入力。登録と同じ項目を全置換する。
// imageKey は新しい画像を選んだときだけ入る(null なら既存の画像をそのまま残す)
export type UpdateSettingServiceInput = Omit<CreateSettingRecordInput, "userId">;

type SettingProductIds = Pick<CreateSettingRecordInput, "barrelId" | "shaftId" | "flightId" | "tipId">;

// 保存先キーから表示用 URL を組み立てる。DB には URL を保存しない(保存先のドメインが変わっても DB を直さずに済む)
function toImageUrl(imageKey: string | null): string | null {
  return imageKey === null ? null : getObjectStorage().publicUrl(imageKey);
}

// 一覧カード用のDTOに変換する。合計価格は保存していないので、ここで算出する
function toListItemDto(setting: SettingListItemRecord): SettingListItemDto {
  return {
    id: setting.id,
    title: setting.title,
    imageUrl: toImageUrl(setting.imageKey),
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

/**
 * 登録で送られてきた画像のキーが、本人がアップロードした正しい画像か確認する。違反していれば SettingImageError を throw する。
 * 画面から送られるキーは改ざんでき、S3Mock は署名付き POST の条件(サイズ・形式)を検証しないため、
 * 保存の直前に S3 上の実物を先頭 16 バイトだけ取得して確かめる
 * ① キーの形が正しく、本人(userId)の prefix である
 * ② オブジェクトが存在する(403/404 は存在しない扱い)
 * ③ サイズが 1 バイト以上・5MB 以下
 * ④ Content-Type と中身(先頭バイト)の形式が、どちらもキーの拡張子の形式と一致する
 */
async function assertUploadedImage(userId: string, imageKey: string): Promise<void> {
  const parsed = parseSettingImageKey(imageKey);
  if (!parsed || parsed.userId !== userId) {
    throw new SettingImageError();
  }

  const inspection = await getObjectStorage().inspect(imageKey);
  if (!inspection || inspection.size < 1) {
    throw new SettingImageError();
  }
  if (inspection.size > SETTING_IMAGE_MAX_BYTES) {
    throw new SettingImageError(SETTING_IMAGE_SIZE_MESSAGE);
  }
  if (inspection.contentType !== parsed.type || detectImageType(inspection.firstBytes) !== parsed.type) {
    throw new SettingImageError();
  }
}

// 画像の後片付け。失敗しても元の処理の結果は変えず、ログだけ残す(残った画像は MVP では許容)
async function deleteImageQuietly(imageKey: string): Promise<void> {
  try {
    await getObjectStorage().delete(imageKey);
  } catch (error) {
    console.error("[setting] 画像の削除に失敗しました", { imageKey, error });
  }
}

/**
 * どのセッティングからも参照されていない画像だけを削除する(後片付け用)。
 * 使用状況を確認できなければ削除しない。失敗してもエラーにはせずログだけ残す。
 * P2002 の判定(Repository の制約名の確認)が Prisma / adapter の更新で外れても、使用中の画像を消さないための確認
 */
async function deleteUnreferencedImage(imageKey: string): Promise<void> {
  try {
    if (await SettingRepository.existsByImageKey(imageKey)) {
      return;
    }
  } catch (error) {
    console.error("[setting] 画像の使用状況を確認できなかったため削除しません", { imageKey, error });
    return;
  }
  await deleteImageQuietly(imageKey);
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

  /**
   * 画像のアップロード先(署名付き POST)を発行する。キーは settings/{userId}/{UUID}.{拡張子}。
   * サイズ(1〜5MB)・Content-Type・キーは署名の条件で固定し、S3 が検証する
   */
  async createImageUpload(userId: string, contentType: SettingImageType): Promise<SettingImageUploadDto> {
    const key = buildSettingImageKey(userId, contentType);
    const upload = await getObjectStorage().createPresignedUpload({
      key,
      contentType,
      maxBytes: SETTING_IMAGE_MAX_BYTES,
    });
    return { ...upload, key };
  },

  /**
   * 登録フォームからの新規作成。商品の組み合わせと画像を検証してから保存し、作成したセッティングのidを返す。
   * 画像のキーがすでに別のセッティングで使われていれば SettingImageError を throw する(その画像は消さない)。
   * それ以外の保存の失敗では、アップロードされた画像を(どのセッティングからも参照されていなければ)削除してから
   * 元のエラーを throw する
   */
  async create(userId: string, input: CreateSettingServiceInput): Promise<{ id: string }> {
    await assertValidProducts(input);
    if (input.imageKey !== null) {
      await assertUploadedImage(userId, input.imageKey);
    }

    let created: { id: string } | null;
    try {
      created = await SettingRepository.create({ ...input, userId });
    } catch (error) {
      if (input.imageKey !== null) {
        await deleteUnreferencedImage(input.imageKey);
      }
      throw error;
    }

    if (!created) {
      throw new SettingImageError();
    }
    return created;
  },

  /**
   * 登録の検証エラーで戻るときに、アップロード済みの画像を削除する(次の送信で画面がアップロードし直す)。
   * 本人の prefix でないキーと、いずれかのセッティングで使われているキーは削除しない
   * (改ざんされたキーで、他人や使用中の画像を消させないため)。失敗してもエラーにはせずログだけ残す
   */
  async discardUploadedImage(userId: string, imageKey: string): Promise<void> {
    if (!isOwnSettingImageKey(userId, imageKey)) {
      return;
    }
    await deleteUnreferencedImage(imageKey);
  },

  // 編集フォームの初期値。対象が無い場合と他人の投稿の場合は、区別せず SettingNotFoundError を throw する
  async getForEdit(userId: string, id: string): Promise<SettingEditDto> {
    const setting = await SettingRepository.findById(id);
    if (!setting || setting.userId !== userId) {
      throw new SettingNotFoundError();
    }

    return {
      title: setting.title,
      description: setting.description,
      imageUrl: toImageUrl(setting.imageKey),
      barrelId: setting.barrelId,
      shaftId: setting.shaftId,
      flightId: setting.flightId,
      tipId: setting.tipId,
    };
  },

  /**
   * 自分の投稿の更新。投稿者を確認してから、登録と同じ業務ルールと画像の確認をして保存する。
   * 新しい画像(imageKey)があるときだけ差し替え、成功したら古い画像を(どこからも参照されていなければ)削除する。
   * 古い画像の削除に失敗してもログだけ残し、更新は成功扱いにする。
   * imageKey がすでに別のセッティングで使われていれば SettingImageError を throw する(その画像は消さない)。
   * それ以外の保存の失敗では、新しい画像を(どこからも参照されていなければ)削除してから元のエラーを throw する
   */
  async update(userId: string, id: string, input: UpdateSettingServiceInput): Promise<void> {
    const setting = await SettingRepository.findById(id);
    if (!setting || setting.userId !== userId) {
      throw new SettingNotFoundError();
    }

    await assertValidProducts(input);

    const { imageKey: newImageKey, ...fields } = input;
    // 現在の画像と同じキーが送られてきた場合(改ざんなど)は差し替えとして扱わない
    const replacingImageKey = newImageKey !== null && newImageKey !== setting.imageKey ? newImageKey : null;
    if (replacingImageKey !== null) {
      await assertUploadedImage(userId, replacingImageKey);
    }

    // 新しい画像を選んでいなければ imageKey を渡さず、既存の画像を null で上書きしない
    const data: UpdateSettingRecordInput =
      replacingImageKey === null ? fields : { ...fields, imageKey: replacingImageKey };

    let result: UpdateSettingRecordResult;
    try {
      result = await SettingRepository.update(id, userId, data);
    } catch (error) {
      if (replacingImageKey !== null) {
        await deleteUnreferencedImage(replacingImageKey);
      }
      throw error;
    }

    // 確認してから更新するまでの間に、別の操作で削除された場合(新しい画像の後片付けは Controller で行う)
    if (result === "not_found") {
      throw new SettingNotFoundError();
    }
    if (result === "image_key_taken") {
      throw new SettingImageError();
    }

    if (replacingImageKey !== null && setting.imageKey !== null) {
      await deleteUnreferencedImage(setting.imageKey);
    }
  },

  /**
   * 自分の投稿の削除。対象が無い場合と他人の投稿の場合は、区別せず SettingNotFoundError を throw する。
   * 投稿者を確認してから削除し、削除した行の画像を(どこからも参照されていなければ)削除する。
   * 画像は削除した行から取るため、確認と削除の間に画像が差し替えられていても最新の画像を消せる。
   * 画像の削除に失敗してもログだけ残し、操作は成功扱いにする。DB の削除に失敗したら画像には触れない
   */
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

    if (deleted.imageKey !== null) {
      await deleteUnreferencedImage(deleted.imageKey);
    }
  },

  /**
   * Seed専用。APIからは公開しない。サンプルセッティングの画像をサーバーから保存し、保存先キーを返す。
   * キーは settings/{userId}/{uuid}.{拡張子}。uuid を固定して毎回同じキーに上書きするため、
   * Seed を再実行しても画像は増えない(UUID を変えずにファイルを差し替えれば、次の Seed で反映される)。
   * 形式(先頭バイト)とサイズは登録フォームと同じルールで検証し、違反していれば ValidationError を throw する
   */
  async uploadSeedImage(userId: string, uuid: string, body: Uint8Array): Promise<string> {
    const type = detectImageType(body);
    if (type === null) {
      throw new ValidationError(SETTING_IMAGE_TYPE_MESSAGE);
    }
    if (body.byteLength > SETTING_IMAGE_MAX_BYTES) {
      throw new ValidationError(SETTING_IMAGE_SIZE_MESSAGE);
    }

    const key = buildSettingImageKey(userId, type, uuid);
    await getObjectStorage().put(key, body, type);
    return key;
  },

  // Seed専用。APIからは公開しない。Seedを再実行しても重複しないよう固定idでupsertする
  // 登録フォームと同じ業務ルールで検証し、Seed のデータの誤りにも気づけるようにする
  async upsert(id: string, data: UpsertSettingInput) {
    await assertValidProducts(data);

    return SettingRepository.upsert(id, data);
  },
};
