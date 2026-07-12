export const invoiceStatuses = ["draft", "reviewed", "issued", "paid", "cancelled"] as const;

export type InvoiceStatus = (typeof invoiceStatuses)[number];
