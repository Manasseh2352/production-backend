import { prisma } from "../prisma/client";
import { farmerRepository } from "../repositories/farmerRepository";
import { walletRepository } from "../repositories/walletRepository";
import { notificationService } from "./notificationService";

export const walletService = {
  async getWallet(userId: string) {
    const profile = await farmerRepository.requireProfileByUserId(userId);
    return walletRepository.ensureWallet(profile.id);
  },

  async listTransactions(userId: string, opts: { limit?: number; offset?: number }) {
    const profile = await farmerRepository.requireProfileByUserId(userId);
    const wallet = await walletRepository.ensureWallet(profile.id);
    const transactions = await walletRepository.listTransactions({
      walletId: wallet.id,
      limit: opts.limit,
      offset: opts.offset,
    });
    return { wallet, transactions };
  },

  async requestWithdrawal(userId: string, amount: number) {
    const profile = await farmerRepository.requireProfileByUserId(userId);

    const result = await prisma.$transaction(
      async (tx: any) => walletRepository.withdraw(tx, { farmerProfileId: profile.id, amount }),
      { maxWait: 10000, timeout: 20000 }
    );

    // Best-effort confirmation notification after the withdrawal commits.
    await notificationService.emit({
      userId,
      type: "WITHDRAWAL_REQUESTED",
      ctx: { amount, currency: result.wallet.currency },
    });

    return result;
  },
};
