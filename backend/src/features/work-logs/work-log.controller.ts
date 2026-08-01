import type { Response } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import {
  readRouteParam,
  requireAuthenticatedUser,
  respondWithZodError
} from "../../shared/http/controller-helpers.js";
import {
  createWorkLog,
  deleteWorkLog,
  getWorkLogById,
  getWorkLogPeriod,
  listWorkLogOptions,
  listWorkLogs,
  reviewWorkLogPeriod,
  submitWorkLogWeek,
  unsubmitWorkLogWeek,
  updateWorkLog,
  WorkLogAccessError,
  WorkLogNotFoundError,
  WorkLogValidationError
} from "./work-log.service.js";
import {
  workLogListQuerySchema,
  workLogPayloadSchema,
  workLogPeriodQuerySchema,
  workLogPeriodReviewSchema,
  workLogWeekSubmissionSchema
} from "./work-log.schemas.js";

const handleWorkLogError = (error: unknown, response: Response) => {
  if (respondWithZodError(response, error, "Invalid work-log payload")) {
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

/** Returns the projects, services, and assignees allowed by the current user so
 * the work-log form cannot submit arbitrary relationship IDs. */
export const listWorkLogOptionsHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const options = await listWorkLogOptions(authUser);
    response.status(200).json(options);
  } catch {
    response.status(500).json({ message: "Unable to fetch work-log options right now" });
  }
};

/** Parses date/project/member filters and returns only work logs visible to the
 * current role and ownership rules. */
export const listWorkLogsHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const query = workLogListQuerySchema.parse(request.query);
    const workLogs = await listWorkLogs(query, authUser);
    response.status(200).json(workLogs);
  } catch (error: unknown) {
    if (respondWithZodError(response, error, "Invalid work-log query")) {
      return;
    }

    response.status(500).json({ message: "Unable to fetch work logs right now" });
  }
};

/** Loads one work log for editing or review after enforcing ownership and role
 * access in the service layer. */
export const getWorkLogHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const workLog = await getWorkLogById(readRouteParam(request.params.workLogId), authUser);
    response.status(200).json(workLog);
  } catch (error: unknown) {
    if (handleWorkLogError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to fetch this work log right now" });
  }
};

/** Validates a new line, confirms the project month is open, and applies daily
 * and weekly hour limits before saving it. */
export const createWorkLogHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const payload = workLogPayloadSchema.parse(request.body);
    const workLog = await createWorkLog(payload, authUser);
    response.status(201).json(workLog);
  } catch (error: unknown) {
    if (handleWorkLogError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to create this work log right now" });
  }
};

/** Updates a line only when its project month and submission state still allow
 * edits; submitted or approved data is protected from casual changes. */
export const updateWorkLogHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const payload = workLogPayloadSchema.parse(request.body);
    const workLog = await updateWorkLog(readRouteParam(request.params.workLogId), payload, authUser);
    response.status(200).json(workLog);
  } catch (error: unknown) {
    if (handleWorkLogError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to update this work log right now" });
  }
};

/** Deletes a line only before the relevant submission/approval lock is reached,
 * returning the same domain errors as create and update. */
export const deleteWorkLogHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    await deleteWorkLog(readRouteParam(request.params.workLogId), authUser);
    response.status(204).send();
  } catch (error: unknown) {
    if (handleWorkLogError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to delete this work log right now" });
  }
};

/** Returns month-level approval, missing-week, and submission state used by the
 * work-log and manager approval screens. */
export const getWorkLogPeriodHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const query = workLogPeriodQuerySchema.parse(request.query);
    const period = await getWorkLogPeriod(query.projectId, query.monthStart, authUser);
    response.status(200).json(period);
  } catch (error: unknown) {
    if (handleWorkLogError(error, response)) {
      return;
    }

    if (respondWithZodError(response, error, "Invalid work-log period query")) {
      return;
    }

    response.status(500).json({ message: "Unable to fetch this work-log month right now" });
  }
};

/** Applies the manager/admin month review decision after validating the review
 * reason and the current period state. */
export const reviewWorkLogPeriodHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const payload = workLogPeriodReviewSchema.parse(request.body);
    const period = await reviewWorkLogPeriod(payload, authUser);
    response.status(200).json(period);
  } catch (error: unknown) {
    if (handleWorkLogError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to review this work-log month right now" });
  }
};

/** Marks a complete weekly submission as submitted, which makes its lines
 * eligible for manager review and later invoice creation. */
export const submitWorkLogWeekHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const payload = workLogWeekSubmissionSchema.parse(request.body);
    const submission = await submitWorkLogWeek(payload, authUser);
    response.status(201).json(submission);
  } catch (error: unknown) {
    if (handleWorkLogError(error, response)) {
      return;
    }

    if (respondWithZodError(response, error, "Invalid work-log week submission payload")) {
      return;
    }

    response.status(500).json({ message: "Unable to submit this work-log week right now" });
  }
};

/** Withdraws a weekly submission only when the workflow has not advanced too
 * far for the current role to safely edit it again. */
export const unsubmitWorkLogWeekHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const payload = workLogWeekSubmissionSchema.parse(request.body);
    await unsubmitWorkLogWeek(payload, authUser);
    response.status(204).send();
  } catch (error: unknown) {
    if (handleWorkLogError(error, response)) {
      return;
    }

    if (respondWithZodError(response, error, "Invalid work-log week submission payload")) {
      return;
    }

    response.status(500).json({ message: "Unable to unsubmit this work-log week right now" });
  }
};
