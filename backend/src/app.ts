import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRouter } from "./features/auth/auth.routes.js";
import { customerRouter } from "./features/customers/customer.routes.js";
import { jobRouter } from "./features/jobs/job.routes.js";
import { serviceRouter } from "./features/services/service.routes.js";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN
    })
  );
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/customers", customerRouter);
  app.use("/api/services", serviceRouter);
  app.use("/api/jobs", jobRouter);

  return app;
};
