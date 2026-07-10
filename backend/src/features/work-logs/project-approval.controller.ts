import type { Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import {
  readRouteParam,
  requireAuthenticatedUser,
  respondWithZodError
} from "../../shared/http/controller-helpers.js";
import {
  finalizeProjectApprovalMonth,
  getProjectApprovalDetail,
  listProjectApprovals,
  reviewProjectApprovalLine
} from "./project-approval.service.js";
import {
  finalizeProjectApprovalSchema,
  projectApprovalDetailQuerySchema,
  projectApprovalListQuerySchema,
  workLogLineReviewSchema
} from "./project-approval.schemas.js";
import {
  WorkLogAccessError,
  WorkLogNotFoundError,
  WorkLogValidationError
} from "./work-log.service.js";

const handleProjectApprovalError = (error: unknown, response: Response) => {
  if (respondWithZodError(response, error, "Invalid project approval payload")) {
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

export const listProjectApprovalsHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const query = projectApprovalListQuerySchema.parse(request.query);
    const results = await listProjectApprovals(query, authUser);
    response.status(200).json(results);
  } catch (error: unknown) {
    if (handleProjectApprovalError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to fetch project approvals right now" });
  }
};

export const getProjectApprovalDetailHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const query = projectApprovalDetailQuerySchema.parse(request.query);
    const result = await getProjectApprovalDetail(
      readRouteParam(request.params.projectId),
      query.monthStart,
      authUser
    );
    response.status(200).json(result);
  } catch (error: unknown) {
    if (handleProjectApprovalError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to fetch this project approval right now" });
  }
};

export const reviewProjectApprovalLineHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const payload = workLogLineReviewSchema.parse(request.body);
    const result = await reviewProjectApprovalLine(readRouteParam(request.params.workLogId), payload, authUser);
    response.status(200).json(result);
  } catch (error: unknown) {
    if (handleProjectApprovalError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to review this work log line right now" });
  }
};

export const finalizeProjectApprovalMonthHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const payload = finalizeProjectApprovalSchema.parse(request.body);
    const result = await finalizeProjectApprovalMonth(readRouteParam(request.params.projectId), payload, authUser);
    response.status(200).json(result);
  } catch (error: unknown) {
    if (handleProjectApprovalError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to finalize this project approval month right now" });
  }
};
