export const invoiceStatuses = ["draft", "rejected", "reviewed", "issued", "paid", "cancelled"] as const;

export type InvoiceStatus = (typeof invoiceStatuses)[number];
