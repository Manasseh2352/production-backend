"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPaymentController = void 0;
const adminPaymentService_1 = require("../services/admin/adminPaymentService");
exports.adminPaymentController = {
    async list(req, res, next) {
        try {
            const query = req.validatedQuery;
            const result = await adminPaymentService_1.adminPaymentService.listPayments(query);
            return res.json({ ok: true, ...result });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=adminPaymentController.js.map