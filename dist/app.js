"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const notFound_1 = require("./middleware/notFound");
const errorHandler_1 = require("./middleware/errorHandler");
const health_1 = require("./routes/health");
const auth_1 = require("./routes/auth");
const createApp = () => {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)());
    app.use((0, morgan_1.default)("combined"));
    // Default JSON body parsing
    app.use(express_1.default.json());
    // Raw body parsing for payment webhooks (signature verification)
    // Note: keeps compatibility with Stripe/Paystack webhook signature validation.
    app.use("/webhooks", express_1.default.raw({ type: "application/json" }));
    app.use((0, cookie_parser_1.default)());
    app.use("/", health_1.healthRouter);
    app.use("/auth", auth_1.authRouter);
    // Market pricing module
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { marketPriceIndexRouter } = require("./routes/marketPrice/index");
    app.use("/", marketPriceIndexRouter);
    // Farmer module
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { farmerIndexRouter } = require("./routes/farmer/index");
    app.use("/farmer", farmerIndexRouter);
    // Buyer module
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { buyerIndexRouter } = require("./routes/buyer/index");
    app.use("/buyer", buyerIndexRouter);
    // Admin module
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { adminIndexRouter } = require("./routes/admin/index");
    app.use("/admin", adminIndexRouter);
    app.use(notFound_1.notFound);
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
//# sourceMappingURL=app.js.map