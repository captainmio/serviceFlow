import { Router } from "express";
import { loginHandler, logoutHandler, refreshHandler, sessionHandler } from "./auth.controller.js";
import { requireAuth } from "./auth.middleware.js";

export const authRouter = Router();

authRouter.post("/login", loginHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/logout", logoutHandler);
authRouter.get("/session", requireAuth, sessionHandler);
