import { prisma } from "../prisma/client";

// Accepts either the base prisma client or a transaction client (`tx`).
type Db = any;

export type NotificationTypeName =
  | "CART_ITEM_ADDED"
  | "PAYMENT_SENT"
  | "ORDER_PLACED"
  | "PAYMENT_RECEIVED"
  | "ORDER_ACCEPTED"
  | "ORDER_PACKED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "ORDER_REJECTED"
  | "RECEIPT_CONFIRMED"
  | "ESCROW_RELEASED"
  | "WITHDRAWAL_REQUESTED";

export type NotificationRow = {
  userId: string;
  type: NotificationTypeName;
  title: string;
  body: string;
  orderId?: string | null;
  data?: unknown;
};

export const notificationRepository = {
  async create(row: NotificationRow, db: Db = prisma) {
    return db.notification.create({
      data: {
        userId: row.userId,
        type: row.type as any,
        title: row.title,
        body: row.body,
        orderId: row.orderId ?? null,
        data: (row.data ?? undefined) as any,
      },
    });
  },

  async createMany(rows: NotificationRow[], db: Db = prisma) {
    if (!rows.length) return { count: 0 };
    return db.notification.createMany({
      data: rows.map((row) => ({
        userId: row.userId,
        type: row.type as any,
        title: row.title,
        body: row.body,
        orderId: row.orderId ?? null,
        data: (row.data ?? undefined) as any,
      })),
    });
  },

  async listForUser(params: {
    userId: string;
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) {
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
    const offset = params.offset && params.offset >= 0 ? params.offset : 0;

    return prisma.notification.findMany({
      where: {
        userId: params.userId,
        ...(params.unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  },

  async unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, readAt: null } });
  },

  // Scoped by userId so a user can only ever mark their own notifications.
  async markRead(userId: string, id: string) {
    const result = await prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count > 0;
  },

  async markAllRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  },
};
