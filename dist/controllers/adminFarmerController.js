"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminFarmerController = void 0;
const adminFarmerService_1 = require("../services/admin/adminFarmerService");
exports.adminFarmerController = {
    async list(req, res, next) {
        try {
            const query = req.validatedQuery;
            const result = await adminFarmerService_1.adminFarmerService.listFarmers(query);
            return res.json({ ok: true, ...result });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=adminFarmerController.js.map