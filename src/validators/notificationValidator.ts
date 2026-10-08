import { z } from "zod";

// Body for POST /buyer/notifications/cart — the app calls this when the buyer
// adds an item to their (client-side) cart. No cart is persisted server-side;
// this only records the buyer-facing notification.
export const cartNotifySchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1).optional(),
  quantityKg: z.number().positive().optional(),
});

export const listNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  // ?unread=true restricts the feed to unread notifications.
  unread: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export type CartNotifyInput = z.infer<typeof cartNotifySchema>;
