"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = void 0;
const notificationService_1 = require("../services/notificationService");
const notificationValidator_1 = require("../validators/notificationValidator");
// Shared by buyer and farmer routers — notifications are keyed on req.user.id,
// so the same handlers serve both roles.
exports.notificationController = {
    async list(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const q = notificationValidator_1.listNotificationsQuerySchema.parse(req.query);
            const [notifications, unreadCount] = await Promise.all([
                notificationService_1.notificationService.list({
                    userId,
                    limit: q.limit,
                    offset: q.offset,
                    unreadOnly: q.unread,
                }),
                notificationService_1.notificationService.unreadCount(userId),
            ]);
            return res.json({ ok: true, unreadCount, notifications });
        }
        catch (err) {
            next(err);
        }
    },
    async unreadCount(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const unreadCount = await notificationService_1.notificationService.unreadCount(userId);
            return res.json({ ok: true, unreadCount });
        }
        catch (err) {
            next(err);
        }
    },
    async markRead(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const updated = await notificationService_1.notificationService.markRead(userId, id);
            if (!updated) {
                return res.status(404).json({ error: "Notification not found" });
            }
            return res.json({ ok: true });
        }
        catch (err) {
            next(err);
        }
    },
    async markAllRead(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const updated = await notificationService_1.notificationService.markAllRead(userId);
            return res.json({ ok: true, updated });
        }
        catch (err) {
            next(err);
        }
    },
    // Buyer-only: record an "added to cart" notification.
    async notifyCartItem(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const body = notificationValidator_1.cartNotifySchema.parse(req.body);
            const notification = await notificationService_1.notificationService.create({
                userId,
                type: "CART_ITEM_ADDED",
                ctx: {
                    productId: body.productId,
                    productName: body.productName,
                    quantityKg: body.quantityKg,
                },
            });
            return res.status(201).json({ ok: true, notification });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=notificationController.js.map