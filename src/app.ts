import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";


export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(morgan("combined"));

  // Default JSON body parsing
  app.use(express.json());
  // Raw body parsing for payment webhooks (signature verification)
  // Note: keeps compatibility with Stripe/Paystack webhook signature validation.
  app.use(
    "/webhooks",
    express.raw({ type: "application/json" })
  );

  app.use(cookieParser());


  app.use("/", healthRouter);
  app.use("/auth", authRouter);

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

  // AI module (price prediction, demand forecasting, profit estimation,
  // crop recommendation, shipping recommendation)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { aiIndexRouter } = require("./routes/ai/index");
  app.use("/ai", aiIndexRouter);

  app.use(notFound);


  app.use(errorHandler);

  return app;
};


