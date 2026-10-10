import { z } from "zod";
import { flightSystemSchema } from "@/schemas/flight-system";

// Prismaの FlightType enum と同じ値。Client Component がPrismaに依存しないよう、こちらで定義する
export const flightTypeSchema = z.enum(["MOLDED", "SHAFT_INTEGRATED"]);

export type FlightType = z.infer<typeof flightTypeSchema>;

export const createFlightSchema = z.object({
  name: z.string().min(1),
  maker: z.string().min(1),
  price: z.number().int().nonnegative(),
  imageUrl: z.string().min(1),
  hiveUrl: z.string().optional(),
  flightType: flightTypeSchema,
  // シャフト一体型のときだけ値が入る。表記はShaft.shaftLengthに揃える(例: "27.5mm")
  shaftLength: z.string().min(1).nullable().optional(),
  flightShape: z.string().min(1),
  // 成型のときだけ値が入る。シャフト一体型はシャフト部分ごと交換するため規格を持たない
  flightSystem: flightSystemSchema.nullable().optional(),
});

export type CreateFlightInput = z.infer<typeof createFlightSchema>;
