"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const notificationRepository_1 = require("../repositories/notificationRepository");
const shortId = (id) => (id ? `#${id.slice(0, 8)}` : "");
const money = (currency, amount) => {
    if (amount === undefined || amount === null)
        return "";
    const n = typeof amount === "number" ? amount : Number(amount);
    const value = Number.isFinite(n) ? n.toFixed(2) : String(amount);
    return `${currency ?? "USD"} ${value}`;
};
// Maps a notification type + context to a human-readable title/body.
const buildMessage = (type, ctx) => {
    const order = shortId(ctx.orderId);
    const amount = money(ctx.currency, ctx.amount);
    const product = ctx.productName ?? "Item";
    switch (type) {
        case "CART_ITEM_ADDED":
            return { title: "Added to cart", body: `${product} was added to your cart.` };
        case "PAYMENT_SENT":
            return {
                title: "Payment successful",
                body: `Your payment${amount ? ` of ${amount}` : ""} for order ${order} went through.`,
            };
        case "ORDER_PLACED":
            return { title: "New order", body: `You have a new order ${order}.` };
        case "PAYMENT_RECEIVED":
            return {
                title: "Payment received",
                body: `Payment${amount ? ` of ${amount}` : ""} received for order ${order}. Funds are held in escrow until the buyer confirms delivery.`,
            };
        case "ORDER_ACCEPTED":
            return { title: "Order accepted", body: `Your order ${order} was accepted by the farmer.` };
        case "ORDER_PACKED":
            return { title: "Order packed", body: `Your order ${order} has been packed.` };
        case "ORDER_SHIPPED":
            return { title: "Order shipped", body: `Your order ${order} is on its way.` };
        case "ORDER_DELIVERED":
            return {
                title: "Order delivered",
                body: `Your order ${order} has been delivered. Please confirm receipt to release payment to the farmer.`,
            };
        case "ORDER_REJECTED":
            return { title: "Order rejected", body: `Your order ${order} was rejected by the farmer.` };
        case "RECEIPT_CONFIRMED":
            return { title: "Receipt confirmed", body: `The buyer confirmed receipt of order ${order}.` };
        case "ESCROW_RELEASED":
            return {
                title: "Funds released",
                body: `${amount || "Funds"} for order ${order} has been released to your available balance.`,
            };
        case "WITHDRAWAL_REQUESTED":
            return {
                title: "Withdrawal requested",
                body: `Your withdrawal request${amount ? ` of ${amount}` : ""} is being processed.`,
            };
        default:
            return { title: "Notification", body: "" };
    }
};
const compose = (input) => {
    const { title, body } = buildMessage(input.type, input.ctx ?? {});
    return {
        userId: input.userId,
        type: input.type,
        title,
        body,
        orderId: input.ctx?.orderId ?? null,
        data: input.ctx ?? undefined,
    };
};
exports.notificationService = {
    buildMessage,
    // Best-effort emission used by lifecycle hooks (payment, order status, …).
    // Never throws — a failed notification must not break the core operation it
    // is attached to. Accepts a single item or a batch.
    async emit(input) {
        const arr = Array.isArray(input) ? input : [input];
        const rows = arr.map(compose);
        try {
            await notificationRepository_1.notificationRepository.createMany(rows);
        }
        catch (err) {
            // eslint-disable-next-line no-console
            console.error("[notificationService] emit failed", err);
        }
    },
    // Throwing create used by the explicit cart-notify endpoint, where the
    // notification IS the requested operation and failures should surface.
    async create(input) {
        return notificationRepository_1.notificationRepository.create(compose(input));
    },
    list(params) {
        return notificationRepository_1.notificationRepository.listForUser(params);
    },
    unreadCount(userId) {
        return notificationRepository_1.notificationRepository.unreadCount(userId);
    },
    markRead(userId, id) {
        return notificationRepository_1.notificationRepository.markRead(userId, id);
    },
    markAllRead(userId) {
        return notificationRepository_1.notificationRepository.markAllRead(userId);
    },
};
//# sourceMappingURL=notificationService.js.map