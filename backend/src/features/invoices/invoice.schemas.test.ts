import assert from "node:assert/strict";
import test from "node:test";
import { createInvoiceDraftSchema, updateInvoiceStatusSchema } from "./invoice.schemas.js";

test("createInvoiceDraftSchema accepts approved source month invoice payload", () => {
  const parsed = createInvoiceDraftSchema.parse({
    sourceMonths: [{ projectId: "550e8400-e29b-41d4-a716-446655440000", monthStart: "2026-07-01" }],
    invoiceDate: "2026-07-10",
    dueDate: "2026-07-24",
    taxAmount: 15.5,
    notes: "Monthly invoice"
  });

  assert.equal(parsed.sourceMonths.length, 1);
  assert.equal(parsed.taxAmount, 15.5);
});

test("createInvoiceDraftSchema requires at least one source month", () => {
  const result = createInvoiceDraftSchema.safeParse({
    sourceMonths: [],
    invoiceDate: "2026-07-10",
    dueDate: "2026-07-24",
    taxAmount: 0,
    notes: ""
  });

  assert.equal(result.success, false);
});

test("updateInvoiceStatusSchema allows reviewed status transition requests", () => {
  const parsed = updateInvoiceStatusSchema.parse({
    status: "reviewed"
  });

  assert.equal(parsed.status, "reviewed");
});
