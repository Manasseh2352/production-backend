"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNotificationsQuerySchema = exports.cartNotifySchema = void 0;
const zod_1 = require("zod");
// Body for POST /buyer/notifications/cart — the app calls this when the buyer
// adds an item to their (client-side) cart. No cart is persisted server-side;
// this only records the buyer-facing notification.
exports.cartNotifySchema = zod_1.z.object({
    productId: zod_1.z.string().min(1),
    productName: zod_1.z.string().min(1).optional(),
    quantityKg: zod_1.z.number().positive().optional(),
});
exports.listNotificationsQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().positive().max(50).optional(),
    offset: zod_1.z.coerce.number().int().nonnegative().optional(),
    // ?unread=true restricts the feed to unread notifications.
    unread: zod_1.z
        .enum(["true", "false"])
        .optional()
        .transform((v) => v === "true"),
});
//# sourceMappingURL=notificationValidator.js.map