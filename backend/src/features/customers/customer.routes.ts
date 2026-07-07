import { Router } from "express";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import {
  createCustomerHandler,
  deleteCustomerHandler,
  listCustomersHandler,
  updateCustomerHandler
} from "./customer.controller.js";

export const customerRouter = Router();

customerRouter.use(requireAuth);
customerRouter.get("/", listCustomersHandler);
customerRouter.post("/", requireRoles(["admin", "manager"]), createCustomerHandler);
customerRouter.put("/:customerId", requireRoles(["admin", "manager"]), updateCustomerHandler);
customerRouter.delete("/:customerId", requireRoles(["admin", "manager"]), deleteCustomerHandler);
