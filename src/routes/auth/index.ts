import { Router } from "express";

import { otpRouter } from "./otp.routes";
import { registerRouter } from "./register.routes";
import { loginRouter } from "./login.routes";
import { refreshRouter } from "./refresh.routes";
import { logoutRouter } from "./logout.routes";

export const authRouter = Router();

authRouter.use("/register", registerRouter);
authRouter.use("/login", loginRouter);
authRouter.use("/otp", otpRouter);
authRouter.use("/refresh", refreshRouter);
authRouter.use("/logout", logoutRouter);
