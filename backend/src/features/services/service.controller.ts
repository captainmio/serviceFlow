import type { Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { isDuplicateEntryError } from "../../shared/database/typeorm-helpers.js";
import { readRouteParam, respondWithZodError } from "../../shared/http/controller-helpers.js";
import { serviceListQuerySchema, servicePayloadSchema } from "./service.schemas.js";
import {
  createService,
  deactivateService,
  listServices,
  updateService
} from "./service.service.js";

const handleServiceMutationError = (error: unknown, response: Response) => {
  if (respondWithZodError(response, error, "Invalid service payload")) {
    return true;
  }

  if (isDuplicateEntryError(error)) {
    response.status(409).json({ message: "A service with that name already exists" });
    return true;
  }

  return false;
};

/** Parses the service-list filters and returns services matching the requested
 * search text and active/inactive state. */
export const listServicesHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const query = serviceListQuerySchema.parse(request.query);
    const services = await listServices(query);
    response.status(200).json(services);
  } catch (error: unknown) {
    if (respondWithZodError(response, error, "Invalid service search query")) {
      return;
    }

    response.status(500).json({ message: "Unable to fetch services right now" });
  }
};

/** Validates the service name and creates the reusable billable service used by
 * project assignments and work-log calculations. */
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

/** Validates and updates the selected service while preserving its historical
 * references in existing projects and invoices. */
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

/** Marks a service inactive instead of deleting it, so historical work logs and
 * invoices continue to display the original service information. */
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
