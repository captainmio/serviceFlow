import { z } from "zod";
import { invoiceStatuses } from "../../entities/invoice-status.js";

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD date format");

export const invoiceSourceMonthSchema = z.object({
  projectId: z.string().uuid("Select a valid project"),
  monthStart: dateField
});

export const createInvoiceDraftSchema = z.object({
  sourceMonths: z.array(invoiceSourceMonthSchema).min(1, "Select at least one approved project month"),
  invoiceDate: dateField,
  dueDate: dateField,
  taxAmount: z.coerce.number().min(0, "Tax amount cannot be negative").default(0),
  notes: z.string().trim().max(2000).default("")
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(invoiceStatuses)
});

export type CreateInvoiceDraftPayload = z.infer<typeof createInvoiceDraftSchema>;
export type UpdateInvoiceStatusPayload = z.infer<typeof updateInvoiceStatusSchema>;
