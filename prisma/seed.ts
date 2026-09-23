import { prisma } from "@/lib/prisma";
import { BarrelService } from "@/server/services/barrel.service";

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

async function main() {
  await seedBarrels();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
