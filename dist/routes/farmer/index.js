"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmerIndexRouter = void 0;
const express_1 = require("express");
const farmer_routes_1 = require("./farmer.routes");
const produce_routes_1 = require("./produce.routes");
exports.farmerIndexRouter = (0, express_1.Router)();
exports.farmerIndexRouter.use("/", farmer_routes_1.farmerRouter);
exports.farmerIndexRouter.use("/", produce_routes_1.produceRouter);
//# sourceMappingURL=index.js.map