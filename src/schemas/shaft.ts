import { z } from "zod";
import { flightSystemSchema } from "@/schemas/flight-system";

export const createShaftSchema = z.object({
  name: z.string().min(1),
  maker: z.string().min(1),
  price: z.number().int().nonnegative(),
  imageUrl: z.string().min(1),
  hiveUrl: z.string().optional(),
  shaftLength: z.string().min(1),
  shaftShape: z.string().min(1),
  isSpin: z.boolean(),
  material: z.string().min(1),
  flightSystem: flightSystemSchema,
});

export type CreateShaftInput = z.infer<typeof createShaftSchema>;
