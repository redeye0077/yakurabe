/**
 * 本番でも再実行できるよう、すべて固定idでupsertする(既存データを一括削除しない)。
 * 投稿データ(ユーザーが作ったセッティング)には触れない。
 * 商品マスタの中身は prisma/seed-data/parts.ts を参照(変更はそちらを直して再実行する)
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { BarrelService } from "@/server/services/barrel.service";
import { ShaftService } from "@/server/services/shaft.service";
import { FlightService } from "@/server/services/flight.service";
import { TipService } from "@/server/services/tip.service";
import { UserService } from "@/server/services/user.service";
import { SettingService } from "@/server/services/setting.service";
import { seedBarrels, seedFlights, seedShafts, seedTips } from "./seed-data/parts";
import { sampleUsers } from "./seed-data/sample-users";
import { buildSampleDescription, sampleSettings, type SampleSetting } from "./seed-data/sample-settings";

async function upsertBarrels() {
  for (const { id, ...data } of seedBarrels) {
    await BarrelService.upsert(id, data);
  }
}

async function upsertShafts() {
  for (const { id, ...data } of seedShafts) {
    await ShaftService.upsert(id, data);
  }
}

async function upsertFlights() {
  for (const { id, ...data } of seedFlights) {
    await FlightService.upsert(id, data);
  }
}

async function upsertTips() {
  for (const { id, ...data } of seedTips) {
    await TipService.upsert(id, data);
  }
}

// サンプルセッティングの投稿者。ログインはできない(UserService.upsertSampleUser を参照)
async function seedSampleUsers() {
  for (const { id, ...data } of sampleUsers) {
    await UserService.upsertSampleUser(id, data);
  }
}

// サンプル画像の置き場所。cwd に依存しないよう、このファイルの場所を基準にする
const SEED_IMAGES_DIR = join(__dirname, "seed-images");

// 画像を S3 に保存し、保存先キーを返す。失敗したら、どのセッティングのどのファイルかを添えて投げ直す(元のエラーは cause)
async function uploadSampleImage(
  settingId: string,
  userId: string,
  { fileName, uuid }: NonNullable<SampleSetting["image"]>
): Promise<string> {
  try {
    const body = new Uint8Array(await readFile(join(SEED_IMAGES_DIR, fileName)));
    return await SettingService.uploadSeedImage(userId, uuid, body);
  } catch (error) {
    throw new Error(
      `サンプルセッティング ${settingId} の画像(prisma/seed-images/${fileName})を保存できませんでした`,
      { cause: error }
    );
  }
}

// 一覧が空にならないよう表示するサンプル。データと組み合わせのルールは prisma/seed-data/sample-settings.ts を参照
async function seedSampleSettings() {
  for (const { id, image, description, ...data } of sampleSettings) {
    const imageKey = image ? await uploadSampleImage(id, data.userId, image) : null;
    await SettingService.upsert(id, {
      ...data,
      description: buildSampleDescription({ description, image }),
      imageKey,
    });
  }
}

async function main() {
  await upsertBarrels();
  await upsertShafts();
  await upsertFlights();
  await upsertTips();
  // セッティングは商品とユーザーを参照するため最後に投入する
  await seedSampleUsers();
  await seedSampleSettings();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
