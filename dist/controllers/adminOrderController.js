"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrderController = void 0;
const adminOrderService_1 = require("../services/admin/adminOrderService");
exports.adminOrderController = {
    async list(req, res, next) {
        try {
            const query = req.validatedQuery;
            const result = await adminOrderService_1.adminOrderService.listOrders(query);
            return res.json({ ok: true, ...result });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=adminOrderController.js.map