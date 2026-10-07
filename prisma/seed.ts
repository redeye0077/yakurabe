import { prisma } from "@/lib/prisma";
import { BarrelService } from "@/server/services/barrel.service";
import { ShaftService } from "@/server/services/shaft.service";

async function seedBarrels() {
  const barrels = [
    {
      name: "Air Rocket",
      maker: "TARGET",
      price: 15000,
      imageUrl: "https://example.com/images/air-rocket.png",
      weight: 18.5,
      totalLength: 42.0,
      maxDiameter: 6.5,
      material: "タングステン95%",
    },
    {
      name: "Bee Element",
      maker: "DYNASTY",
      price: 18000,
      imageUrl: "https://example.com/images/bee-element.png",
      weight: 20.0,
      totalLength: 45.5,
      maxDiameter: 7.0,
      material: "タングステン90%",
    },
  ];

  await prisma.barrel.deleteMany();

  for (const barrel of barrels) {
    await BarrelService.create(barrel);
  }
}

// 価格・長さは仮の値。公開前に要確認
async function seedShafts() {
  const shafts = [
    {
      name: "L-Shaft ロック ストレート 260",
      maker: "L-style",
      price: 660,
      imageUrl: "https://example.com/images/l-shaft-lock-straight-260.png",
      shaftLength: "26.0mm",
      shaftShape: "ストレート",
      isSpin: false,
      material: "ポリカーボネート",
    },
    {
      name: "L-Shaft ロック スリム 260",
      maker: "L-style",
      price: 660,
      imageUrl: "https://example.com/images/l-shaft-lock-slim-260.png",
      shaftLength: "26.0mm",
      shaftShape: "スリム",
      isSpin: false,
      material: "ポリカーボネート",
    },
    {
      name: "L-Shaft ロック スピン 300",
      maker: "L-style",
      price: 770,
      imageUrl: "https://example.com/images/l-shaft-lock-spin-300.png",
      shaftLength: "30.0mm",
      shaftShape: "ストレート",
      isSpin: true,
      material: "ポリカーボネート",
    },
    {
      name: "L-Shaft カーボン ロック ストレート 260",
      maker: "L-style",
      price: 1320,
      imageUrl: "https://example.com/images/l-shaft-carbon-lock-straight-260.png",
      shaftLength: "26.0mm",
      shaftShape: "ストレート",
      isSpin: false,
      material: "カーボン",
    },
    {
      name: "Fit Shaft GEAR ノーマル ロック",
      maker: "COSMO DARTS",
      price: 660,
      imageUrl: "https://example.com/images/fit-shaft-gear-normal-lock.png",
      shaftLength: "24.0mm",
      shaftShape: "ストレート",
      isSpin: false,
      material: "ポリカーボネート",
    },
    {
      name: "Fit Shaft GEAR スリム スピン",
      maker: "COSMO DARTS",
      price: 660,
      imageUrl: "https://example.com/images/fit-shaft-gear-slim-spin.png",
      shaftLength: "28.0mm",
      shaftShape: "スリム",
      isSpin: true,
      material: "ポリカーボネート",
    },
    {
      name: "Fit Shaft CARBON ノーマル ロック",
      maker: "COSMO DARTS",
      price: 1650,
      imageUrl: "https://example.com/images/fit-shaft-carbon-normal-lock.png",
      shaftLength: "24.0mm",
      shaftShape: "ストレート",
      isSpin: false,
      material: "カーボン",
    },
    {
      name: "Pro Grip シャフト ミディアム",
      maker: "TARGET",
      price: 660,
      imageUrl: "https://example.com/images/pro-grip-medium.png",
      shaftLength: "48.0mm",
      shaftShape: "ストレート",
      isSpin: false,
      material: "ナイロン",
    },
    {
      name: "Pro Grip スピン ショート",
      maker: "TARGET",
      price: 660,
      imageUrl: "https://example.com/images/pro-grip-spin-short.png",
      shaftLength: "34.0mm",
      shaftShape: "ストレート",
      isSpin: true,
      material: "ナイロン",
    },
    {
      name: "Supergrip Fusion ミディアム",
      maker: "Harrows",
      price: 550,
      imageUrl: "https://example.com/images/supergrip-fusion-medium.png",
      shaftLength: "47.0mm",
      shaftShape: "ストレート",
      isSpin: false,
      material: "ナイロン",
    },
  ];

  await prisma.shaft.deleteMany();

  for (const shaft of shafts) {
    await ShaftService.create(shaft);
  }
}

async function main() {
  await seedBarrels();
  await seedShafts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
