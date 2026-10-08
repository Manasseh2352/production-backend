"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminProductController = void 0;
const adminProductService_1 = require("../services/admin/adminProductService");
exports.adminProductController = {
    async list(req, res, next) {
        try {
            const query = req.validatedQuery;
            const result = await adminProductService_1.adminProductService.listProducts(query);
            return res.json({ ok: true, ...result });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=adminProductController.js.map