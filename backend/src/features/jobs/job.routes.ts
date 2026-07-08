import { Router } from "express";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import {
  cancelJobHandler,
  createJobHandler,
  getJobHandler,
  listJobsHandler,
  updateJobHandler
} from "./job.controller.js";

export const projectRouter = Router();

projectRouter.use(requireAuth);
projectRouter.get("/", listJobsHandler);
projectRouter.get("/:jobId", getJobHandler);
projectRouter.post("/", requireRoles(["admin"]), createJobHandler);
projectRouter.put("/:jobId", requireRoles(["admin"]), updateJobHandler);
projectRouter.patch("/:jobId/cancel", requireRoles(["admin"]), cancelJobHandler);
