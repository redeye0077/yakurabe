// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "mysql",
  port: 3306,
  user: process.env.DATABASE_USER ?? "yakurabe_app",
  password: process.env.DATABASE_PASSWORD ?? "",
  database: process.env.DATABASE_NAME ?? "yakurabe",
  connectionLimit: 5,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
globalForPrisma.prisma = prisma;
