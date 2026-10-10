import { z } from "zod";

// Prismaの FlightSystem enum と同じ値。Client Component がPrismaに依存しないよう、こちらで定義する
// シャフトとフライトの接続規格。規格が違うと物理的に組み合わせられない
export const flightSystemSchema = z.enum(["UNIVERSAL", "FIT", "CLICK", "EIGHT"]);

export type FlightSystem = z.infer<typeof flightSystemSchema>;
