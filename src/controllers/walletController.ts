import type { NextFunction, Request, Response } from "express";

import { walletService } from "../services/walletService";
import {
  listTransactionsQuerySchema,
  withdrawSchema,
} from "../validators/walletValidator";

export const walletController = {
  async getWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const wallet = await walletService.getWallet(userId);
      return res.json({ ok: true, wallet });
    } catch (err) {
      next(err);
    }
  },

  async listTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const q = listTransactionsQuerySchema.parse(req.query);
      const result = await walletService.listTransactions(userId, {
        limit: q.limit,
        offset: q.offset,
      });
      return res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async requestWithdrawal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const body = withdrawSchema.parse(req.body);
      const result = await walletService.requestWithdrawal(userId, body.amount);
      return res.status(201).json({
        ok: true,
        wallet: result.wallet,
        withdrawal: result.withdrawal,
      });
    } catch (err) {
      next(err);
    }
  },
};
