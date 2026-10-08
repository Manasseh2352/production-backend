"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBuyerController = void 0;
const adminBuyerService_1 = require("../services/admin/adminBuyerService");
exports.adminBuyerController = {
    async list(req, res, next) {
        try {
            const query = req.validatedQuery;
            const result = await adminBuyerService_1.adminBuyerService.listBuyers(query);
            return res.json({ ok: true, ...result });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=adminBuyerController.js.map