import { Router } from "express";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import {
  createTeamMemberHandler,
  getTeamMemberHandler,
  listAssignableUsersHandler,
  listTeamMembersHandler,
  updateTeamMemberHandler
} from "./user.controller.js";

export const userRouter = Router();

userRouter.use(requireAuth);
userRouter.get("/assignable", requireRoles(["admin", "manager"]), listAssignableUsersHandler);
userRouter.get("/", requireRoles(["admin", "manager"]), listTeamMembersHandler);
userRouter.get("/:userUuid", requireRoles(["admin", "manager"]), getTeamMemberHandler);
userRouter.post("/", requireRoles(["admin"]), createTeamMemberHandler);
userRouter.put("/:userUuid", requireRoles(["admin"]), updateTeamMemberHandler);
