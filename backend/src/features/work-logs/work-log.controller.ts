import type { Response } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import {
  createWorkLog,
  deleteWorkLog,
  getWorkLogById,
  getWorkLogPeriod,
  listWorkLogOptions,
  listWorkLogs,
  reviewWorkLogPeriod,
  updateWorkLog,
  WorkLogAccessError,
  WorkLogNotFoundError,
  WorkLogValidationError
} from "./work-log.service.js";
import {
  workLogListQuerySchema,
  workLogPayloadSchema,
  workLogPeriodQuerySchema,
  workLogPeriodReviewSchema
} from "./work-log.schemas.js";

const readRouteParam = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

const handleWorkLogError = (error: unknown, response: Response) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Invalid work-log payload",
      issues: error.flatten()
    });
    return true;
  }

  if (error instanceof WorkLogValidationError) {
    response.status(409).json({ message: error.message });
    return true;
  }

  if (error instanceof WorkLogAccessError) {
    response.status(403).json({ message: error.message });
    return true;
  }

  if (error instanceof WorkLogNotFoundError) {
    response.status(404).json({ message: error.message });
    return true;
  }

  return false;
};

export const listWorkLogOptionsHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    if (!request.authUser) {
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    const options = await listWorkLogOptions(request.authUser);
    response.status(200).json(options);
  } catch {
    response.status(500).json({ message: "Unable to fetch work-log options right now" });
  }
};

export const listWorkLogsHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    if (!request.authUser) {
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    const query = workLogListQuerySchema.parse(request.query);
    const workLogs = await listWorkLogs(query, request.authUser);
    response.status(200).json(workLogs);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Invalid work-log query",
        issues: error.flatten()
      });
      return;
    }

    response.status(500).json({ message: "Unable to fetch work logs right now" });
  }
};

export const getWorkLogHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    if (!request.authUser) {
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    const workLog = await getWorkLogById(readRouteParam(request.params.workLogId), request.authUser);
    response.status(200).json(workLog);
  } catch (error: unknown) {
    if (handleWorkLogError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to fetch this work log right now" });
  }
};

export const createWorkLogHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    if (!request.authUser) {
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    const payload = workLogPayloadSchema.parse(request.body);
    const workLog = await createWorkLog(payload, request.authUser);
    response.status(201).json(workLog);
  } catch (error: unknown) {
    if (handleWorkLogError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to create this work log right now" });
  }
};

export const updateWorkLogHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    if (!request.authUser) {
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    const payload = workLogPayloadSchema.parse(request.body);
    const workLog = await updateWorkLog(
      readRouteParam(request.params.workLogId),
      payload,
      request.authUser
    );
    response.status(200).json(workLog);
  } catch (error: unknown) {
    if (handleWorkLogError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to update this work log right now" });
  }
};

export const deleteWorkLogHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    if (!request.authUser) {
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    await deleteWorkLog(readRouteParam(request.params.workLogId), request.authUser);
    response.status(204).send();
  } catch (error: unknown) {
    if (handleWorkLogError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to delete this work log right now" });
  }
};

export const getWorkLogPeriodHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    if (!request.authUser) {
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    const query = workLogPeriodQuerySchema.parse(request.query);
    const period = await getWorkLogPeriod(query.projectId, query.monthStart, request.authUser);
    response.status(200).json(period);
  } catch (error: unknown) {
    if (handleWorkLogError(error, response)) {
      return;
    }

    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Invalid work-log period query",
        issues: error.flatten()
      });
      return;
    }

    response.status(500).json({ message: "Unable to fetch this work-log month right now" });
  }
};

export const reviewWorkLogPeriodHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    if (!request.authUser) {
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    const payload = workLogPeriodReviewSchema.parse(request.body);
    const period = await reviewWorkLogPeriod(payload, request.authUser);
    response.status(200).json(period);
  } catch (error: unknown) {
    if (handleWorkLogError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to review this work-log month right now" });
  }
};
