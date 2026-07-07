import type { Response } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { createJob, JobDependencyError } from "./job.service.js";
import { jobPayloadSchema } from "./job.schemas.js";

export const createJobHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const payload = jobPayloadSchema.parse(request.body);
    const job = await createJob(payload);
    response.status(201).json(job);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Invalid job payload",
        issues: error.flatten()
      });
      return;
    }

    if (error instanceof JobDependencyError) {
      response.status(409).json({ message: error.message });
      return;
    }

    response.status(500).json({ message: "Unable to create job right now" });
  }
};
