import type { Response } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import {
  JobAlreadyExistsError,
  cancelJob,
  createJob,
  getJobById,
  JobDependencyError,
  JobNotFoundError,
  listJobs,
  updateJob
} from "./job.service.js";
import { jobListQuerySchema, jobPayloadSchema } from "./job.schemas.js";

const readRouteParam = (value: string | string[] | undefined) => {
  if (typeof value === "string") {
    return value;
  }

  return "";
};

const handleJobError = (error: unknown, response: Response) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Invalid job payload",
      issues: error.flatten()
    });
    return true;
  }

  if (error instanceof JobDependencyError) {
    response.status(409).json({ message: error.message });
    return true;
  }

  if (error instanceof JobAlreadyExistsError) {
    response.status(409).json({ message: error.message });
    return true;
  }

  if (error instanceof JobNotFoundError) {
    response.status(404).json({ message: error.message });
    return true;
  }

  return false;
};

export const listJobsHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const query = jobListQuerySchema.parse(request.query);
    const jobs = await listJobs(query);
    response.status(200).json(jobs);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Invalid job search query",
        issues: error.flatten()
      });
      return;
    }

    response.status(500).json({ message: "Unable to fetch jobs right now" });
  }
};

export const getJobHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const job = await getJobById(readRouteParam(request.params.jobId));
    response.status(200).json(job);
  } catch (error: unknown) {
    if (handleJobError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to fetch this job right now" });
  }
};

export const createJobHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const payload = jobPayloadSchema.parse(request.body);
    if (!request.authUser) {
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    const job = await createJob(payload, request.authUser);
    response.status(201).json(job);
  } catch (error: unknown) {
    if (handleJobError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to create job right now" });
  }
};

export const updateJobHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const payload = jobPayloadSchema.parse(request.body);

    if (!request.authUser) {
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    const job = await updateJob(readRouteParam(request.params.jobId), payload, request.authUser);
    response.status(200).json(job);
  } catch (error: unknown) {
    if (handleJobError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to update job right now" });
  }
};

export const cancelJobHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    if (!request.authUser) {
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    const job = await cancelJob(readRouteParam(request.params.jobId), request.authUser);
    response.status(200).json(job);
  } catch (error: unknown) {
    if (handleJobError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to cancel job right now" });
  }
};
