"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletRepository = void 0;
const client_1 = require("../prisma/client");
exports.walletRepository = {
    // Every farmer has exactly one wallet, created lazily on first use.
    async ensureWallet(farmerProfileId, db = client_1.prisma) {
        return db.wallet.upsert({
            where: { farmerProfileId },
            update: {},
            create: { farmerProfileId },
        });
    },
    async getByFarmerProfileId(farmerProfileId) {
        return exports.walletRepository.ensureWallet(farmerProfileId);
    },
    async listTransactions(params) {
        const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
        const offset = params.offset && params.offset >= 0 ? params.offset : 0;
        return client_1.prisma.walletTransaction.findMany({
            where: { walletId: params.walletId },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
        });
    },
    // Hold a farmer's goods value in escrow when a buyer pays. Must run inside the
    // payment transaction so the hold and the payment commit together.
    async holdEscrow(tx, params) {
        if (params.amount <= 0)
            return null;
        const wallet = await exports.walletRepository.ensureWallet(params.farmerProfileId, tx);
        const updated = await tx.wallet.update({
            where: { id: wallet.id },
            data: { escrowBalance: { increment: params.amount } },
        });
        await tx.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: "ESCROW_HOLD",
                amount: params.amount,
                currency: params.currency ?? wallet.currency,
                orderId: params.orderId,
                note: "Payment held in escrow",
                availableBalanceAfter: updated.availableBalance,
                escrowBalanceAfter: updated.escrowBalance,
            },
        });
        return updated;
    },
    // Move all outstanding escrow holds for an order into available balance.
    // Idempotent: wallets already released for this order are skipped.
    async releaseEscrowForOrder(tx, params) {
        return settleHolds(tx, {
            orderId: params.orderId,
            type: "ESCROW_RELEASE",
            note: "Escrow released on buyer receipt confirmation",
            toAvailable: true,
        });
    },
    // Reverse outstanding escrow holds for an order (e.g. farmer rejects a paid
    // order). Escrow is removed without crediting available balance.
    async reverseEscrowForOrder(tx, params) {
        return settleHolds(tx, {
            orderId: params.orderId,
            type: "ESCROW_REVERSAL",
            note: "Escrow reversed on order rejection",
            toAvailable: false,
        });
    },
    // Decrement available balance and record a pending withdrawal. Runs inside a
    // transaction. Throws 400 if the requested amount exceeds available funds.
    async withdraw(tx, params) {
        const wallet = await exports.walletRepository.ensureWallet(params.farmerProfileId, tx);
        if (Number(wallet.availableBalance) < params.amount) {
            const err = new Error("Insufficient available balance");
            err.status = 400;
            throw err;
        }
        const updated = await tx.wallet.update({
            where: { id: wallet.id },
            data: { availableBalance: { decrement: params.amount } },
        });
        const withdrawal = await tx.walletWithdrawal.create({
            data: {
                walletId: wallet.id,
                amount: params.amount,
                currency: wallet.currency,
                status: "PENDING",
            },
        });
        await tx.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: "WITHDRAWAL",
                amount: params.amount,
                currency: wallet.currency,
                note: "Withdrawal requested",
                availableBalanceAfter: updated.availableBalance,
                escrowBalanceAfter: updated.escrowBalance,
            },
        });
        return { wallet: updated, withdrawal };
    },
};
// Shared logic for release/reversal: find outstanding ESCROW_HOLD amounts per
// wallet for an order and settle them, writing a ledger row per wallet.
async function settleHolds(tx, params) {
    const holds = await tx.walletTransaction.findMany({
        where: { orderId: params.orderId, type: "ESCROW_HOLD" },
    });
    if (!holds.length)
        return [];
    // Wallets already settled for this order (release or reversal) are skipped.
    const settled = await tx.walletTransaction.findMany({
        where: { orderId: params.orderId, type: { in: ["ESCROW_RELEASE", "ESCROW_REVERSAL"] } },
        select: { walletId: true },
    });
    const settledWalletIds = new Set(settled.map((r) => r.walletId));
    const amountByWallet = new Map();
    for (const hold of holds) {
        if (settledWalletIds.has(hold.walletId))
            continue;
        amountByWallet.set(hold.walletId, (amountByWallet.get(hold.walletId) ?? 0) + Number(hold.amount));
    }
    const movements = [];
    for (const [walletId, requested] of amountByWallet) {
        const wallet = await tx.wallet.findUnique({
            where: { id: walletId },
            include: { farmerProfile: { select: { userId: true } } },
        });
        if (!wallet)
            continue;
        // Never move more than what is actually held in escrow.
        const amount = Math.min(requested, Number(wallet.escrowBalance));
        if (amount <= 0)
            continue;
        const updated = await tx.wallet.update({
            where: { id: walletId },
            data: {
                escrowBalance: { decrement: amount },
                ...(params.toAvailable ? { availableBalance: { increment: amount } } : {}),
            },
        });
        await tx.walletTransaction.create({
            data: {
                walletId,
                type: params.type,
                amount,
                currency: wallet.currency,
                orderId: params.orderId,
                note: params.note,
                availableBalanceAfter: updated.availableBalance,
                escrowBalanceAfter: updated.escrowBalance,
            },
        });
        movements.push({
            walletId,
            farmerProfileId: wallet.farmerProfileId,
            userId: wallet.farmerProfile.userId,
            amount,
            currency: wallet.currency,
        });
    }
    return movements;
}
//# sourceMappingURL=walletRepository.js.map