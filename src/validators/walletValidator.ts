import { z } from "zod";

export const withdrawSchema = z.object({
  amount: z.number().positive(),
});

export const listTransactionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export type WithdrawInput = z.infer<typeof withdrawSchema>;
