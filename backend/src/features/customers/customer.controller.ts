import type { Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { isDuplicateEntryError } from "../../shared/database/typeorm-helpers.js";
import { readRouteParam, respondWithZodError } from "../../shared/http/controller-helpers.js";
import {
  createCustomer,
  CustomerDeleteBlockedError,
  deleteCustomer,
  listCustomers,
  updateCustomer
} from "./customer.service.js";
import { customerListQuerySchema, customerPayloadSchema } from "./customer.schemas.js";

const handleMutationError = (error: unknown, response: Response) => {
  if (respondWithZodError(response, error, "Invalid customer payload")) {
    return true;
  }

  if (error instanceof CustomerDeleteBlockedError) {
    response.status(409).json({ message: error.message });
    return true;
  }

  if (isDuplicateEntryError(error)) {
    response.status(409).json({ message: "A customer with that email already exists" });
    return true;
  }

  return false;
};

export const listCustomersHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const query = customerListQuerySchema.parse(request.query);
    const customers = await listCustomers(query);
    response.status(200).json(customers);
  } catch (error: unknown) {
    if (respondWithZodError(response, error, "Invalid customer search query")) {
      return;
    }

    response.status(500).json({ message: "Unable to fetch customers right now" });
  }
};

export const createCustomerHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const payload = customerPayloadSchema.parse(request.body);
    const customer = await createCustomer(payload);
    response.status(201).json(customer);
  } catch (error: unknown) {
    if (handleMutationError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to create customer right now" });
  }
};

export const updateCustomerHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const payload = customerPayloadSchema.parse(request.body);
    const customer = await updateCustomer(readRouteParam(request.params.customerId), payload);

    if (!customer) {
      response.status(404).json({ message: "Customer not found" });
      return;
    }

    response.status(200).json(customer);
  } catch (error: unknown) {
    if (handleMutationError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to update customer right now" });
  }
};

export const deleteCustomerHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const deleted = await deleteCustomer(readRouteParam(request.params.customerId));

    if (!deleted) {
      response.status(404).json({ message: "Customer not found" });
      return;
    }

    response.status(204).send();
  } catch (error: unknown) {
    if (handleMutationError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to delete customer right now" });
  }
};
