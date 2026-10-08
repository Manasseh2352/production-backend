"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletController = void 0;
const walletService_1 = require("../services/walletService");
const walletValidator_1 = require("../validators/walletValidator");
exports.walletController = {
    async getWallet(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const wallet = await walletService_1.walletService.getWallet(userId);
            return res.json({ ok: true, wallet });
        }
        catch (err) {
            next(err);
        }
    },
    async listTransactions(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const q = walletValidator_1.listTransactionsQuerySchema.parse(req.query);
            const result = await walletService_1.walletService.listTransactions(userId, {
                limit: q.limit,
                offset: q.offset,
            });
            return res.json({ ok: true, ...result });
        }
        catch (err) {
            next(err);
        }
    },
    async requestWithdrawal(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const body = walletValidator_1.withdrawSchema.parse(req.body);
            const result = await walletService_1.walletService.requestWithdrawal(userId, body.amount);
            return res.status(201).json({
                ok: true,
                wallet: result.wallet,
                withdrawal: result.withdrawal,
            });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=walletController.js.map