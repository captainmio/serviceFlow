import type { Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import {
  readRouteParam,
  requireAuthenticatedUser,
  respondWithZodError
} from "../../shared/http/controller-helpers.js";
import {
  createInvoiceDraft,
  deleteInvoiceDraft,
  getInvoiceDetail,
  InvoiceAccessError,
  InvoiceNotFoundError,
  InvoiceValidationError,
  listInvoices,
  listNotifications,
  markAllNotificationsRead,
  rejectInvoice,
  updateInvoiceDraft,
  updateInvoiceStatus
} from "./invoice.service.js";
import {
  createInvoiceDraftSchema,
  rejectInvoiceSchema,
  updateInvoiceDraftSchema,
  updateInvoiceStatusSchema
} from "./invoice.schemas.js";

const handleInvoiceError = (error: unknown, response: Response) => {
  if (respondWithZodError(response, error, "Invalid invoice payload")) {
    return true;
  }

  if (error instanceof InvoiceValidationError) {
    response.status(409).json({ message: error.message });
    return true;
  }

  if (error instanceof InvoiceAccessError) {
    response.status(403).json({ message: error.message });
    return true;
  }

  if (error instanceof InvoiceNotFoundError) {
    response.status(404).json({ message: error.message });
    return true;
  }

  return false;
};

export const listInvoicesHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const result = await listInvoices(authUser);
    response.status(200).json(result);
  } catch (error: unknown) {
    if (handleInvoiceError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to fetch invoices right now" });
  }
};

export const getInvoiceDetailHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const result = await getInvoiceDetail(readRouteParam(request.params.invoiceId), authUser);
    response.status(200).json(result);
  } catch (error: unknown) {
    if (handleInvoiceError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to fetch this invoice right now" });
  }
};

export const createInvoiceDraftHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const payload = createInvoiceDraftSchema.parse(request.body);
    const result = await createInvoiceDraft(payload, authUser);
    response.status(201).json(result);
  } catch (error: unknown) {
    if (handleInvoiceError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to create this invoice draft right now" });
  }
};

export const deleteInvoiceDraftHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    await deleteInvoiceDraft(readRouteParam(request.params.invoiceId), authUser);
    response.status(204).send();
  } catch (error: unknown) {
    if (handleInvoiceError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to delete this invoice draft right now" });
  }
};

export const rejectInvoiceHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const payload = rejectInvoiceSchema.parse(request.body);
    const result = await rejectInvoice(readRouteParam(request.params.invoiceId), payload, authUser);
    response.status(200).json(result);
  } catch (error: unknown) {
    if (handleInvoiceError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to reject this invoice draft right now" });
  }
};

export const updateInvoiceDraftHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const payload = updateInvoiceDraftSchema.parse(request.body);
    const result = await updateInvoiceDraft(readRouteParam(request.params.invoiceId), payload, authUser);
    response.status(200).json(result);
  } catch (error: unknown) {
    if (handleInvoiceError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to update this invoice draft right now" });
  }
};

export const updateInvoiceStatusHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const payload = updateInvoiceStatusSchema.parse(request.body);
    const result = await updateInvoiceStatus(readRouteParam(request.params.invoiceId), payload, authUser);
    response.status(200).json(result);
  } catch (error: unknown) {
    if (handleInvoiceError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to update this invoice right now" });
  }
};

export const listNotificationsHandler = async (request: AuthenticatedRequest, response: Response) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const result = await listNotifications(authUser);
    response.status(200).json(result);
  } catch (error: unknown) {
    if (handleInvoiceError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to fetch notifications right now" });
  }
};

export const markAllNotificationsReadHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const authUser = requireAuthenticatedUser(request, response);

    if (!authUser) {
      return;
    }

    const result = await markAllNotificationsRead(authUser);
    response.status(200).json(result);
  } catch (error: unknown) {
    if (handleInvoiceError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to update notifications right now" });
  }
};
