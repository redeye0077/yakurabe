import { NextRequest } from "next/server";
import { BarrelController } from "@/server/controllers/barrel.controller";

export async function GET(req: NextRequest) {
  return BarrelController.search(req);
}
