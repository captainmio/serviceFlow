import type { Response } from "express";
import { QueryFailedError } from "typeorm";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import {
  createCustomer,
  CustomerDeleteBlockedError,
  deleteCustomer,
  listCustomers,
  updateCustomer
} from "./customer.service.js";
import { customerListQuerySchema, customerPayloadSchema } from "./customer.schemas.js";

const readRouteParam = (value: string | string[] | undefined) => {
  if (typeof value === "string") {
    return value;
  }

  return "";
};

const handleMutationError = (error: unknown, response: Response) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Invalid customer payload",
      issues: error.flatten()
    });
    return true;
  }

  if (error instanceof CustomerDeleteBlockedError) {
    response.status(409).json({ message: error.message });
    return true;
  }

  if (
    error instanceof QueryFailedError &&
    typeof error.driverError === "object" &&
    error.driverError !== null &&
    "code" in error.driverError &&
    error.driverError.code === "ER_DUP_ENTRY"
  ) {
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
    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Invalid customer search query",
        issues: error.flatten()
      });
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
