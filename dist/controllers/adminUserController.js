"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUserController = void 0;
const adminUserService_1 = require("../services/admin/adminUserService");
exports.adminUserController = {
    async list(req, res, next) {
        try {
            const query = req.validatedQuery;
            const result = await adminUserService_1.adminUserService.listUsers(query);
            return res.json({ ok: true, ...result });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=adminUserController.js.map