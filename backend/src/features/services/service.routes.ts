import { Router } from "express";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import {
  createServiceHandler,
  deactivateServiceHandler,
  listServicesHandler,
  updateServiceHandler
} from "./service.controller.js";

export const serviceRouter = Router();

serviceRouter.use(requireAuth);
serviceRouter.get("/", listServicesHandler);
serviceRouter.post("/", requireRoles(["admin", "manager"]), createServiceHandler);
serviceRouter.put("/:serviceId", requireRoles(["admin", "manager"]), updateServiceHandler);
serviceRouter.patch(
  "/:serviceId/deactivate",
  requireRoles(["admin", "manager"]),
  deactivateServiceHandler
);
