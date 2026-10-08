"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyerIndexRouter = void 0;
const express_1 = require("express");
const buyer_routes_1 = require("./buyer.routes");
exports.buyerIndexRouter = (0, express_1.Router)();
exports.buyerIndexRouter.use("/", buyer_routes_1.buyerRouter);
//# sourceMappingURL=index.js.map