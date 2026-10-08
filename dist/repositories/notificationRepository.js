"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRepository = void 0;
const client_1 = require("../prisma/client");
exports.notificationRepository = {
    async create(row, db = client_1.prisma) {
        return db.notification.create({
            data: {
                userId: row.userId,
                type: row.type,
                title: row.title,
                body: row.body,
                orderId: row.orderId ?? null,
                data: (row.data ?? undefined),
            },
        });
    },
    async createMany(rows, db = client_1.prisma) {
        if (!rows.length)
            return { count: 0 };
        return db.notification.createMany({
            data: rows.map((row) => ({
                userId: row.userId,
                type: row.type,
                title: row.title,
                body: row.body,
                orderId: row.orderId ?? null,
                data: (row.data ?? undefined),
            })),
        });
    },
    async listForUser(params) {
        const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
        const offset = params.offset && params.offset >= 0 ? params.offset : 0;
        return client_1.prisma.notification.findMany({
            where: {
                userId: params.userId,
                ...(params.unreadOnly ? { readAt: null } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
        });
    },
    async unreadCount(userId) {
        return client_1.prisma.notification.count({ where: { userId, readAt: null } });
    },
    // Scoped by userId so a user can only ever mark their own notifications.
    async markRead(userId, id) {
        const result = await client_1.prisma.notification.updateMany({
            where: { id, userId, readAt: null },
            data: { readAt: new Date() },
        });
        return result.count > 0;
    },
    async markAllRead(userId) {
        const result = await client_1.prisma.notification.updateMany({
            where: { userId, readAt: null },
            data: { readAt: new Date() },
        });
        return result.count;
    },
};
//# sourceMappingURL=notificationRepository.js.map