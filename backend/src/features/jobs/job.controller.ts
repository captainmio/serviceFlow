import type { Response } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import {
  readRouteParam,
  requireAuthenticatedUser,
  respondWithZodError
} from "../../shared/http/controller-helpers.js";
import {
  JobAccessError,
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

const handleJobError = (error: unknown, response: Response) => {
  if (respondWithZodError(response, error, "Invalid job payload")) {
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

  if (error instanceof JobAccessError) {
    response.status(403).json({ message: error.message });
    return true;
  }

  return false;
};

/** Parses project filters and returns only projects the current role is allowed
 * to see, including manager-specific visibility rules. */
export const listJobsHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const query = jobListQuerySchema.parse(request.query);
    const jobs = await listJobs(query, authUser);
    response.status(200).json(jobs);
  } catch (error: unknown) {
    if (respondWithZodError(response, error, "Invalid job search query")) {
      return;
    }

    response.status(500).json({ message: "Unable to fetch jobs right now" });
  }
};

/** Loads one project by route ID. The service performs the definitive access
 * check instead of trusting the caller's route or role alone. */
export const getJobHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const job = await getJobById(readRouteParam(request.params.jobId), authUser);
    response.status(200).json(job);
  } catch (error: unknown) {
    if (handleJobError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to fetch this job right now" });
  }
};

/** Validates project dates, customer, manager, services, and assignees before
 * creating the project and its relationship records. */
export const createJobHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const payload = jobPayloadSchema.parse(request.body);
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const job = await createJob(payload, authUser);
    response.status(201).json(job);
  } catch (error: unknown) {
    if (handleJobError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to create job right now" });
  }
};

/** Applies a validated project update and synchronizes its service and assignee
 * relationships without allowing invalid status/date combinations. */
export const updateJobHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const payload = jobPayloadSchema.parse(request.body);
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const job = await updateJob(readRouteParam(request.params.jobId), payload, authUser);
    response.status(200).json(job);
  } catch (error: unknown) {
    if (handleJobError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to update job right now" });
  }
};

/** Cancels a project only when its current workflow state and dependent-record
 * rules permit cancellation. */
export const cancelJobHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const job = await cancelJob(readRouteParam(request.params.jobId), authUser);
    response.status(200).json(job);
  } catch (error: unknown) {
    if (handleJobError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to cancel job right now" });
  }
};
