import { z } from "zod";

// Prismaの TipThreadSize enum と同じ値。Client Component がPrismaに依存しないよう、こちらで定義する
export const tipThreadSizeSchema = z.enum(["TWO_BA", "NO_5"]);

export type TipThreadSize = z.infer<typeof tipThreadSizeSchema>;

export const createTipSchema = z.object({
  name: z.string().min(1),
  maker: z.string().min(1),
  price: z.number().int().nonnegative(),
  imageUrl: z.string().min(1),
  hiveUrl: z.string().optional(),
  // ねじ規格のみを表す。形状・長さは商品名で区別する
  threadSize: tipThreadSizeSchema,
});

export type CreateTipInput = z.infer<typeof createTipSchema>;
