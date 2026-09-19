import { z } from "zod";

export const searchBarrelSchema = z.object({
  q: z.string().trim().optional(),
});

export type SearchBarrelInput = z.infer<typeof searchBarrelSchema>;

export const createBarrelSchema = z.object({
  name: z.string().min(1),
  maker: z.string().min(1),
  price: z.number().int().nonnegative(),
  imageUrl: z.string().min(1),
  hiveUrl: z.string().optional(),
  weight: z.number().positive(),
  totalLength: z.number().positive(),
  maxDiameter: z.number().positive(),
  material: z.string().min(1),
});

export type CreateBarrelInput = z.infer<typeof createBarrelSchema>;
