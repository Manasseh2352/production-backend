"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketPriceIndexRouter = void 0;
const express_1 = require("express");
const marketPrice_routes_1 = require("./marketPrice.routes");
exports.marketPriceIndexRouter = (0, express_1.Router)();
exports.marketPriceIndexRouter.use("/market-prices", marketPrice_routes_1.marketPriceRouter);
//# sourceMappingURL=index.js.map