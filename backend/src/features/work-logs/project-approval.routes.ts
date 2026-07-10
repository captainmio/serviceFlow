import { Router } from "express";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import {
  finalizeProjectApprovalMonthHandler,
  getProjectApprovalDetailHandler,
  listProjectApprovalsHandler,
  reviewProjectApprovalLineHandler
} from "./project-approval.controller.js";

export const projectApprovalRouter = Router();

projectApprovalRouter.use(requireAuth);
projectApprovalRouter.use(requireRoles(["admin", "manager"]));
projectApprovalRouter.get("/", listProjectApprovalsHandler);
projectApprovalRouter.get("/:projectId", getProjectApprovalDetailHandler);
projectApprovalRouter.patch("/work-logs/:workLogId/review", reviewProjectApprovalLineHandler);
projectApprovalRouter.post("/:projectId/finalize", finalizeProjectApprovalMonthHandler);
