import { prisma } from "../prisma/client";

// Accepts either the base prisma client or a transaction client (`tx`).
type Db = any;

// A wallet movement that was applied, returned so callers can emit
// notifications after the transaction commits.
export type EscrowMovement = {
  walletId: string;
  farmerProfileId: string;
  userId: string;
  amount: number;
  currency: string;
};

export const walletRepository = {
  // Every farmer has exactly one wallet, created lazily on first use.
  async ensureWallet(farmerProfileId: string, db: Db = prisma) {
    return db.wallet.upsert({
      where: { farmerProfileId },
      update: {},
      create: { farmerProfileId },
    });
  },

  async getByFarmerProfileId(farmerProfileId: string) {
    return walletRepository.ensureWallet(farmerProfileId);
  },

  async listTransactions(params: { walletId: string; limit?: number; offset?: number }) {
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 50) : 20;
    const offset = params.offset && params.offset >= 0 ? params.offset : 0;
    return prisma.walletTransaction.findMany({
      where: { walletId: params.walletId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  },

  // Hold a farmer's goods value in escrow when a buyer pays. Must run inside the
  // payment transaction so the hold and the payment commit together.
  async holdEscrow(
    tx: Db,
    params: { farmerProfileId: string; orderId: string; amount: number; currency?: string }
  ) {
    if (params.amount <= 0) return null;

    const wallet = await walletRepository.ensureWallet(params.farmerProfileId, tx);
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
  async releaseEscrowForOrder(tx: Db, params: { orderId: string }): Promise<EscrowMovement[]> {
    return settleHolds(tx, {
      orderId: params.orderId,
      type: "ESCROW_RELEASE",
      note: "Escrow released on buyer receipt confirmation",
      toAvailable: true,
    });
  },

  // Reverse outstanding escrow holds for an order (e.g. farmer rejects a paid
  // order). Escrow is removed without crediting available balance.
  async reverseEscrowForOrder(tx: Db, params: { orderId: string }): Promise<EscrowMovement[]> {
    return settleHolds(tx, {
      orderId: params.orderId,
      type: "ESCROW_REVERSAL",
      note: "Escrow reversed on order rejection",
      toAvailable: false,
    });
  },

  // Decrement available balance and record a pending withdrawal. Runs inside a
  // transaction. Throws 400 if the requested amount exceeds available funds.
  async withdraw(tx: Db, params: { farmerProfileId: string; amount: number }) {
    const wallet = await walletRepository.ensureWallet(params.farmerProfileId, tx);

    if (Number(wallet.availableBalance) < params.amount) {
      const err: any = new Error("Insufficient available balance");
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
async function settleHolds(
  tx: Db,
  params: { orderId: string; type: "ESCROW_RELEASE" | "ESCROW_REVERSAL"; note: string; toAvailable: boolean }
): Promise<EscrowMovement[]> {
  const holds = await tx.walletTransaction.findMany({
    where: { orderId: params.orderId, type: "ESCROW_HOLD" },
  });
  if (!holds.length) return [];

  // Wallets already settled for this order (release or reversal) are skipped.
  const settled = await tx.walletTransaction.findMany({
    where: { orderId: params.orderId, type: { in: ["ESCROW_RELEASE", "ESCROW_REVERSAL"] } },
    select: { walletId: true },
  });
  const settledWalletIds = new Set(settled.map((r: any) => r.walletId));

  const amountByWallet = new Map<string, number>();
  for (const hold of holds) {
    if (settledWalletIds.has(hold.walletId)) continue;
    amountByWallet.set(
      hold.walletId,
      (amountByWallet.get(hold.walletId) ?? 0) + Number(hold.amount)
    );
  }

  const movements: EscrowMovement[] = [];
  for (const [walletId, requested] of amountByWallet) {
    const wallet = await tx.wallet.findUnique({
      where: { id: walletId },
      include: { farmerProfile: { select: { userId: true } } },
    });
    if (!wallet) continue;

    // Never move more than what is actually held in escrow.
    const amount = Math.min(requested, Number(wallet.escrowBalance));
    if (amount <= 0) continue;

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
