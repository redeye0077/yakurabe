import { NextRequest, NextResponse } from "next/server";
import { searchBarrelSchema } from "@/schemas/barrel";
import { BarrelService } from "@/server/services/barrel.service";

export const BarrelController = {
  async search(req: NextRequest) {
    const parsed = searchBarrelSchema.safeParse({
      q: req.nextUrl.searchParams.get("q") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const barrels = await BarrelService.search(parsed.data.q);
    return NextResponse.json(barrels, { status: 200 });
  },
};
