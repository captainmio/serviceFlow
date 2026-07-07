import { Router } from "express";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import { createJobHandler } from "./job.controller.js";

export const jobRouter = Router();

jobRouter.use(requireAuth);
jobRouter.post("/", requireRoles(["admin", "manager"]), createJobHandler);
