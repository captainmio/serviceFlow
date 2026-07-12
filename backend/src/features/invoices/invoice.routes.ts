import { Router } from "express";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import {
  createInvoiceDraftHandler,
  getInvoiceDetailHandler,
  listInvoicesHandler,
  listNotificationsHandler,
  markAllNotificationsReadHandler,
  updateInvoiceStatusHandler
} from "./invoice.controller.js";

export const invoiceRouter = Router();
export const notificationRouter = Router();

invoiceRouter.use(requireAuth);
invoiceRouter.use(requireRoles(["admin", "manager"]));
invoiceRouter.get("/", listInvoicesHandler);
invoiceRouter.get("/:invoiceId", getInvoiceDetailHandler);
invoiceRouter.post("/", requireRoles(["admin"]), createInvoiceDraftHandler);
invoiceRouter.patch("/:invoiceId/status", updateInvoiceStatusHandler);

notificationRouter.use(requireAuth);
notificationRouter.get("/", listNotificationsHandler);
notificationRouter.patch("/read-all", markAllNotificationsReadHandler);
