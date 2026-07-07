import { Router } from "express";
import { loginHandler } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", loginHandler);
