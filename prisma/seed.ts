/**
 * 価格は2026年10月時点のダーツハイブの価格。スペックも同サイトの商品ページの値(URLは hiveUrl)
 * 画像は未用意のため imageUrl はダミー
 */
import { prisma } from "@/lib/prisma";
import { BarrelService } from "@/server/services/barrel.service";
import { ShaftService } from "@/server/services/shaft.service";
import { CreateShaftInput } from "@/schemas/shaft";
import { FlightService } from "@/server/services/flight.service";
import { CreateFlightInput } from "@/schemas/flight";
import { TipService } from "@/server/services/tip.service";
import { CreateTipInput } from "@/schemas/tip";

async function seedBarrels() {
  const barrels = [
    {
      name: "DISCOVERY LABEL Jeff Smith 2BA",
      maker: "COSMO DARTS",
      price: 17600,
      imageUrl: "https://example.com/images/discovery-label-jeff-smith-2ba.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000040769/",
      weight: 18,
      totalLength: 50.8,
      maxDiameter: 6.1,
      material: "タングステン90%",
    },
    {
      name: "ASTRA DARTS DRAGOON4 No.5",
      maker: "DYNASTY",
      price: 19800,
      imageUrl: "https://example.com/images/astra-darts-dragoon4-no5.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000046854/",
      weight: 18,
      totalLength: 54,
      maxDiameter: 6.5,
      material: "タングステン90%",
    },
    {
      name: "KATANA Houju 2BA",
      maker: "DYNASTY",
      price: 16800,
      imageUrl: "https://example.com/images/katana-houju-2ba.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000032104/",
      weight: 20,
      totalLength: 50,
      maxDiameter: 6.3,
      material: "タングステン90%",
    },
    {
      name: "Mao ver.5 2BA 18g Cherry Red",
      maker: "One80",
      price: 17600,
      imageUrl: "https://example.com/images/mao-ver5-2ba-18g-cherry-red.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000058627/",
      weight: 18,
      totalLength: 38,
      maxDiameter: 7.4,
      material: "タングステン90%",
    },
    {
      name: "Undisputed ROMERO Type4 2BA",
      maker: "TRiNiDAD",
      price: 19800,
      imageUrl: "https://example.com/images/undisputed-romero-type4-2ba.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000056611/",
      weight: 17.5,
      totalLength: 45,
      maxDiameter: 7.2,
      material: "タングステン90%",
    },
  ];

  await prisma.barrel.deleteMany();

  for (const barrel of barrels) {
    await BarrelService.create(barrel);
  }
}

// shaftShape・material はショップの表記のまま入れる
// flightSystem は接続規格。同じ規格のフライトとしか組み合わせられない
async function seedShafts() {
  const shafts: CreateShaftInput[] = [
    {
      name: "L-SHaft Carbon ロック スリム 37.0mm",
      maker: "L-style",
      price: 2200,
      imageUrl: "https://example.com/images/l-shaft-carbon-lock-slim-370.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000050418/",
      shaftLength: "37.0mm",
      shaftShape: "スリム",
      isSpin: false,
      material: "カーボン",
      flightSystem: "UNIVERSAL",
    },
    {
      name: "Fit Shaft COLOR Carbon ノーマル スピン 24.0mm",
      maker: "COSMO DARTS",
      price: 4180,
      imageUrl: "https://example.com/images/fit-shaft-color-carbon-normal-spin-240.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000057178/",
      shaftLength: "24.0mm",
      shaftShape: "ノーマル",
      isSpin: true,
      material: "カーボン",
      flightSystem: "FIT",
    },
    {
      name: "PRO GRIP SHAFT ブラック 19.5mm",
      maker: "TARGET",
      price: 440,
      imageUrl: "https://example.com/images/pro-grip-shaft-black-195.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000053491/",
      shaftLength: "19.5mm",
      shaftShape: "ノーマル",
      isSpin: false,
      material: "ナイロン",
      flightSystem: "UNIVERSAL",
    },
    {
      name: "8FLIGHT シャフト レギュラー FIXED ホワイト 29.5mm",
      maker: "TARGET",
      price: 770,
      imageUrl: "https://example.com/images/8flight-shaft-regular-fixed-white-295.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000017336/",
      shaftLength: "29.5mm",
      shaftShape: "ノーマル",
      isSpin: false,
      material: "ナイロン",
      flightSystem: "EIGHT",
    },
    {
      name: "Fit Shaft GEAR ハイブリッド ロック クリア 24.0mm",
      maker: "COSMO DARTS",
      price: 940,
      imageUrl: "https://example.com/images/fit-shaft-gear-hybrid-lock-clear-240.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000009990/",
      shaftLength: "24.0mm",
      shaftShape: "ハイブリッド",
      isSpin: false,
      material: "ナイロン",
      flightSystem: "FIT",
    },
  ];

  await prisma.shaft.deleteMany();

  for (const shaft of shafts) {
    await ShaftService.create(shaft);
  }
}

// flightType は成型/一体型の区別のみ。形状は flightShape で表す(シート系フライトは扱わない)
// flightSystem は成型のみ必須。シャフト一体型はシャフト部分ごと交換するため規格を持たない
async function seedFlights() {
  const flights: CreateFlightInput[] = [
    {
      name: "L-Flight PRO DYNASTY Sachika ver.1 スモール",
      maker: "L-style",
      price: 990,
      imageUrl: "https://example.com/images/l-flight-pro-dynasty-sachika-ver1-small.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000058488/",
      flightType: "MOLDED",
      flightShape: "スモール",
      flightSystem: "UNIVERSAL",
    },
    {
      name: "GAME OVER K-FLEX スタンダード ブラック 26.0mm",
      maker: "TARGET",
      price: 1980,
      imageUrl: "https://example.com/images/game-over-k-flex-standard-black-260.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000056896/",
      flightType: "SHAFT_INTEGRATED",
      shaftLength: "26.0mm",
      flightShape: "スタンダード",
    },
    {
      name: "Fit Flight AIR × Ami Komiyama ver.4",
      maker: "COSMO DARTS",
      price: 1080,
      imageUrl: "https://example.com/images/fit-flight-air-ami-komiyama-ver4.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000058156/",
      flightType: "MOLDED",
      flightShape: "シェイプ",
      flightSystem: "FIT",
    },
    {
      name: "8FLIGHT スリム",
      maker: "TARGET",
      price: 660,
      imageUrl: "https://example.com/images/8flight-slim.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000019733/",
      flightType: "MOLDED",
      flightShape: "スリム",
      flightSystem: "EIGHT",
    },
    {
      name: "Fit Flight AIR × 鎌田恋 ver.2 ティアドロップ クリア",
      maker: "COSMO DARTS",
      price: 1080,
      imageUrl: "https://example.com/images/fit-flight-air-kamata-ren-ver2-teardrop-clear.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000053607/",
      flightType: "MOLDED",
      flightShape: "ティアドロップ",
      flightSystem: "FIT",
    },
  ];

  await prisma.flight.deleteMany();

  for (const flight of flights) {
    await FlightService.create(flight);
  }
}

// threadSize はねじ規格のみ。形状・長さ・本数は商品名で区別する
async function seedTips() {
  const tips: CreateTipInput[] = [
    {
      name: "Premium Lip point 2BA 30本",
      maker: "L-style",
      price: 660,
      imageUrl: "https://example.com/images/premium-lip-point-2ba-30.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000003244/",
      threadSize: "TWO_BA",
    },
    {
      name: "Premium Lip point No.5 30本",
      maker: "L-style",
      price: 660,
      imageUrl: "https://example.com/images/premium-lip-point-no5-30.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000004221/",
      threadSize: "NO_5",
    },
    {
      name: "FIT POINT PLUS 2.0 2BA 60本",
      maker: "COSMO DARTS",
      price: 770,
      imageUrl: "https://example.com/images/fit-point-plus-2-0-2ba-60.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000057674/",
      threadSize: "TWO_BA",
    },
    {
      name: "TIP ULTIMATE 2BA 40本",
      maker: "CONDOR",
      price: 660,
      imageUrl: "https://example.com/images/tip-ultimate-2ba-40.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000002056/",
      threadSize: "TWO_BA",
    },
    {
      name: "CRYO TIP 2BA 30本",
      maker: "TARGET",
      price: 880,
      imageUrl: "https://example.com/images/cryo-tip-2ba-30.png",
      hiveUrl: "https://www.dartshive.jp/shopdetail/000000054523/",
      threadSize: "TWO_BA",
    },
  ];

  await prisma.tip.deleteMany();

  for (const tip of tips) {
    await TipService.create(tip);
  }
}

async function main() {
  await seedBarrels();
  await seedShafts();
  await seedFlights();
  await seedTips();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
