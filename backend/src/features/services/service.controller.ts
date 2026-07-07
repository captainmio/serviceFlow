import type { Response } from "express";
import { QueryFailedError } from "typeorm";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { serviceListQuerySchema, servicePayloadSchema } from "./service.schemas.js";
import {
  createService,
  deactivateService,
  listServices,
  updateService
} from "./service.service.js";

const readRouteParam = (value: string | string[] | undefined) => {
  if (typeof value === "string") {
    return value;
  }

  return "";
};

const handleServiceMutationError = (error: unknown, response: Response) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Invalid service payload",
      issues: error.flatten()
    });
    return true;
  }

  if (
    error instanceof QueryFailedError &&
    typeof error.driverError === "object" &&
    error.driverError !== null &&
    "code" in error.driverError &&
    error.driverError.code === "ER_DUP_ENTRY"
  ) {
    response.status(409).json({ message: "A service with that name already exists" });
    return true;
  }

  return false;
};

export const listServicesHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const query = serviceListQuerySchema.parse(request.query);
    const services = await listServices(query);
    response.status(200).json(services);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Invalid service search query",
        issues: error.flatten()
      });
      return;
    }

    response.status(500).json({ message: "Unable to fetch services right now" });
  }
};

export const createServiceHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const payload = servicePayloadSchema.parse(request.body);
    const service = await createService(payload);
    response.status(201).json(service);
  } catch (error: unknown) {
    if (handleServiceMutationError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to create service right now" });
  }
};

export const updateServiceHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const payload = servicePayloadSchema.parse(request.body);
    const service = await updateService(readRouteParam(request.params.serviceId), payload);

    if (!service) {
      response.status(404).json({ message: "Service not found" });
      return;
    }

    response.status(200).json(service);
  } catch (error: unknown) {
    if (handleServiceMutationError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to update service right now" });
  }
};

export const deactivateServiceHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const service = await deactivateService(readRouteParam(request.params.serviceId));

    if (!service) {
      response.status(404).json({ message: "Service not found" });
      return;
    }

    response.status(200).json(service);
  } catch {
    response.status(500).json({ message: "Unable to deactivate service right now" });
  }
};
