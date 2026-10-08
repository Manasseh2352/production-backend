import { z } from "zod";

export const adminPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  q: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

export const adminProductQuerySchema = adminPaginationQuerySchema.extend({
  productName: z.string().trim().optional(),
  farmerId: z.string().trim().optional(),
});

export const adminOrderQuerySchema = adminPaginationQuerySchema.extend({
  status: z.string().trim().optional(),
  buyerId: z.string().trim().optional(),
});

export const adminShipmentQuerySchema = adminPaginationQuerySchema.extend({
  orderId: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

export const adminPaymentQuerySchema = adminPaginationQuerySchema.extend({
  orderId: z.string().trim().optional(),
  method: z.string().trim().optional(),
});

