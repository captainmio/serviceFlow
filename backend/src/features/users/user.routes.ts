import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { listAssignableUsersHandler } from "./user.controller.js";

export const userRouter = Router();

userRouter.use(requireAuth);
userRouter.get("/", listAssignableUsersHandler);
