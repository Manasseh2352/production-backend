"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletService = void 0;
const client_1 = require("../prisma/client");
const farmerRepository_1 = require("../repositories/farmerRepository");
const walletRepository_1 = require("../repositories/walletRepository");
const notificationService_1 = require("./notificationService");
exports.walletService = {
    async getWallet(userId) {
        const profile = await farmerRepository_1.farmerRepository.requireProfileByUserId(userId);
        return walletRepository_1.walletRepository.ensureWallet(profile.id);
    },
    async listTransactions(userId, opts) {
        const profile = await farmerRepository_1.farmerRepository.requireProfileByUserId(userId);
        const wallet = await walletRepository_1.walletRepository.ensureWallet(profile.id);
        const transactions = await walletRepository_1.walletRepository.listTransactions({
            walletId: wallet.id,
            limit: opts.limit,
            offset: opts.offset,
        });
        return { wallet, transactions };
    },
    async requestWithdrawal(userId, amount) {
        const profile = await farmerRepository_1.farmerRepository.requireProfileByUserId(userId);
        const result = await client_1.prisma.$transaction(async (tx) => walletRepository_1.walletRepository.withdraw(tx, { farmerProfileId: profile.id, amount }), { maxWait: 10000, timeout: 20000 });
        // Best-effort confirmation notification after the withdrawal commits.
        await notificationService_1.notificationService.emit({
            userId,
            type: "WITHDRAWAL_REQUESTED",
            ctx: { amount, currency: result.wallet.currency },
        });
        return result;
    },
};
//# sourceMappingURL=walletService.js.map