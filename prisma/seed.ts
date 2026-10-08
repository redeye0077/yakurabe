import { prisma } from "@/lib/prisma";
import { BarrelService } from "@/server/services/barrel.service";
import { ShaftService } from "@/server/services/shaft.service";
import { FlightService } from "@/server/services/flight.service";
import { CreateFlightInput } from "@/schemas/flight";

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

// 価格・シャフト長は仮の値。公開前に要確認
// flightType は成型/一体型の区別のみ。形状は flightShape で表す(シート系フライトは扱わない)
async function seedFlights() {
  const flights: CreateFlightInput[] = [
    {
      name: "L-Flight PRO シェイプ",
      maker: "L-style",
      price: 550,
      imageUrl: "https://example.com/images/l-flight-pro-shape.png",
      flightType: "MOLDED",
      flightShape: "シェイプ",
    },
    {
      name: "L-Flight PRO スタンダード",
      maker: "L-style",
      price: 550,
      imageUrl: "https://example.com/images/l-flight-pro-standard.png",
      flightType: "MOLDED",
      flightShape: "スタンダード",
    },
    {
      name: "L-Flight PRO スリム",
      maker: "L-style",
      price: 550,
      imageUrl: "https://example.com/images/l-flight-pro-slim.png",
      flightType: "MOLDED",
      flightShape: "スリム",
    },
    {
      name: "Fit Flight シェイプ",
      maker: "COSMO DARTS",
      price: 495,
      imageUrl: "https://example.com/images/fit-flight-shape.png",
      flightType: "MOLDED",
      flightShape: "シェイプ",
    },
    {
      name: "Fit Flight スタンダード",
      maker: "COSMO DARTS",
      price: 495,
      imageUrl: "https://example.com/images/fit-flight-standard.png",
      flightType: "MOLDED",
      flightShape: "スタンダード",
    },
    {
      name: "Fit Flight スリム",
      maker: "COSMO DARTS",
      price: 495,
      imageUrl: "https://example.com/images/fit-flight-slim.png",
      flightType: "MOLDED",
      flightShape: "スリム",
    },
    {
      name: "Fit Flight AIR シェイプ",
      maker: "COSMO DARTS",
      price: 550,
      imageUrl: "https://example.com/images/fit-flight-air-shape.png",
      flightType: "MOLDED",
      flightShape: "シェイプ",
    },
    {
      name: "Fit Flight AIR スタンダード",
      maker: "COSMO DARTS",
      price: 550,
      imageUrl: "https://example.com/images/fit-flight-air-standard.png",
      flightType: "MOLDED",
      flightShape: "スタンダード",
    },
    {
      name: "CONDOR AXE シェイプ ミディアム 27.5mm",
      maker: "CONDOR",
      price: 1430,
      imageUrl: "https://example.com/images/condor-axe-shape-medium.png",
      flightType: "SHAFT_INTEGRATED",
      shaftLength: "27.5mm",
      flightShape: "シェイプ",
    },
    {
      name: "CONDOR AXE スタンダード ショート 21.5mm",
      maker: "CONDOR",
      price: 1430,
      imageUrl: "https://example.com/images/condor-axe-standard-short.png",
      flightType: "SHAFT_INTEGRATED",
      shaftLength: "21.5mm",
      flightShape: "スタンダード",
    },
  ];

  await prisma.flight.deleteMany();

  for (const flight of flights) {
    await FlightService.create(flight);
  }
}

async function main() {
  await seedBarrels();
  await seedShafts();
  await seedFlights();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
