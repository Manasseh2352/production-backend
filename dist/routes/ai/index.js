"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiIndexRouter = void 0;
const express_1 = require("express");
const ai_routes_1 = require("./ai.routes");
exports.aiIndexRouter = (0, express_1.Router)();
exports.aiIndexRouter.use("/", ai_routes_1.aiRouter);
//# sourceMappingURL=index.js.map