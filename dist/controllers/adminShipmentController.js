"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminShipmentController = void 0;
const adminShipmentService_1 = require("../services/admin/adminShipmentService");
exports.adminShipmentController = {
    async list(req, res, next) {
        try {
            const query = req.validatedQuery;
            const result = await adminShipmentService_1.adminShipmentService.listShipments(query);
            return res.json({ ok: true, ...result });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=adminShipmentController.js.map