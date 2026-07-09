import { Router } from "express";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import {
  createWorkLogHandler,
  deleteWorkLogHandler,
  getWorkLogHandler,
  getWorkLogPeriodHandler,
  listWorkLogOptionsHandler,
  listWorkLogsHandler,
  reviewWorkLogPeriodHandler,
  submitWorkLogWeekHandler,
  unsubmitWorkLogWeekHandler,
  updateWorkLogHandler
} from "./work-log.controller.js";

export const workLogRouter = Router();

workLogRouter.use(requireAuth);
workLogRouter.get("/options", listWorkLogOptionsHandler);
workLogRouter.get("/period", getWorkLogPeriodHandler);
workLogRouter.get("/", listWorkLogsHandler);
workLogRouter.get("/:workLogId", getWorkLogHandler);
workLogRouter.post("/", requireRoles(["manager", "team_member"]), createWorkLogHandler);
workLogRouter.post(
  "/week-submissions",
  requireRoles(["manager", "team_member"]),
  submitWorkLogWeekHandler
);
workLogRouter.delete(
  "/week-submissions",
  requireRoles(["manager", "team_member"]),
  unsubmitWorkLogWeekHandler
);
workLogRouter.put("/:workLogId", updateWorkLogHandler);
workLogRouter.delete("/:workLogId", deleteWorkLogHandler);
workLogRouter.patch("/period/review", requireRoles(["admin"]), reviewWorkLogPeriodHandler);
