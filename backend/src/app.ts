import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRouter } from "./features/auth/auth.routes.js";
import { customerRouter } from "./features/customers/customer.routes.js";
import { invoiceRouter, notificationRouter } from "./features/invoices/invoice.routes.js";
import { projectRouter } from "./features/jobs/job.routes.js";
import { projectApprovalRouter } from "./features/work-logs/project-approval.routes.js";
import { serviceRouter } from "./features/services/service.routes.js";
import { userRouter } from "./features/users/user.routes.js";
import { workLogRouter } from "./features/work-logs/work-log.routes.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/customers", customerRouter);
  app.use("/api/invoices", invoiceRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/services", serviceRouter);
  app.use("/api/projects", projectRouter);
  app.use("/api/project-approvals", projectApprovalRouter);
  app.use("/api/jobs", projectRouter);
  app.use("/api/users", userRouter);
  app.use("/api/work-logs", workLogRouter);

  return app;
};
