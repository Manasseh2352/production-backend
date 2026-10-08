import { z } from "zod";

// NOTE: These validators are for a minimal MVP.
// We snapshot pricing at order creation time and store it on ShipmentItem.

const placeOrderItemSchema = z.object({
  productId: z.string().min(1),
  // quantity in kg (or unit configured in product; MVP stores unit as kg)
  quantityKg: z.number().positive(),
  unitPrice: z.number().positive(),
});

export const placeOrderSchema = z.object({
  notes: z.string().min(1).optional(),

  // Single destination / shipment group for MVP.
  destinationName: z.string().min(1).optional(),
  destinationAddress: z.string().min(1).optional(),
  destinationPhone: z.string().min(1).optional(),
  deliveryMethod: z.enum(["AIR", "FLIGHT"]).default("AIR"),

  items: z.array(placeOrderItemSchema).min(1).max(50),

  // Taxes/shipping can be computed later; for now allow optional overrides.
  currency: z.string().min(1).optional().default("USD"),
  subtotalAmount: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(),
  shippingAmount: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative().optional(),
});

export const acceptRejectOrderParamsSchema = z.object({
  orderId: z.string().min(1),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

