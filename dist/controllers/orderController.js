"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = void 0;
const orderService_1 = require("../services/orderService");
const orderValidator_1 = require("../validators/orderValidator");
exports.orderController = {
    async placeOrder(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const body = orderValidator_1.placeOrderSchema.parse(req.body);
            const created = await orderService_1.orderService.placeOrder(userId, body);
            return res.status(201).json({ ok: true, ...created });
        }
        catch (err) {
            next(err);
        }
    },
    async acceptOrder(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const params = orderValidator_1.acceptRejectOrderParamsSchema.parse({
                orderId: Array.isArray(req.params.orderId)
                    ? req.params.orderId[0]
                    : req.params.orderId,
            });
            const result = await orderService_1.orderService.acceptOrder(userId, params.orderId);
            return res.json({ ...result });
        }
        catch (err) {
            next(err);
        }
    },
    async rejectOrder(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const params = orderValidator_1.acceptRejectOrderParamsSchema.parse({
                orderId: Array.isArray(req.params.orderId)
                    ? req.params.orderId[0]
                    : req.params.orderId,
            });
            const result = await orderService_1.orderService.rejectOrder(userId, params.orderId);
            return res.json({ ...result });
        }
        catch (err) {
            next(err);
        }
    },
    async advanceShipmentStatus(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const params = orderValidator_1.acceptRejectOrderParamsSchema.parse({
                orderId: Array.isArray(req.params.orderId)
                    ? req.params.orderId[0]
                    : req.params.orderId,
            });
            const rawStatus = req.body?.status;
            const validStatuses = ["PACKED", "SHIPPED", "DELIVERED"];
            if (!rawStatus || !validStatuses.includes(rawStatus)) {
                return res.status(400).json({ error: "Invalid shipment status" });
            }
            const result = await orderService_1.orderService.advanceShipmentStatus(userId, params.orderId, rawStatus);
            return res.json({ ...result, ok: true });
        }
        catch (err) {
            next(err);
        }
    },
    // Buyer confirms goods received → releases farmer escrow.
    async confirmReceived(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const params = orderValidator_1.acceptRejectOrderParamsSchema.parse({
                orderId: Array.isArray(req.params.orderId)
                    ? req.params.orderId[0]
                    : req.params.orderId,
            });
            const result = await orderService_1.orderService.confirmReceived(userId, params.orderId);
            return res.json({ ok: true, ...result });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=orderController.js.map