import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedInvoiceStatusTransitions, isInvoiceStatusTransitionAllowed } from "./invoice.service.js";

test("manager can only move a draft invoice to reviewed", () => {
  assert.deepEqual(getAllowedInvoiceStatusTransitions("draft", "manager"), ["reviewed"]);
  assert.equal(
    isInvoiceStatusTransitionAllowed({
      currentStatus: "draft",
      nextStatus: "issued",
      role: "manager"
    }),
    false
  );
});

test("admin can issue reviewed invoices and mark issued invoices as paid", () => {
  assert.deepEqual(getAllowedInvoiceStatusTransitions("reviewed", "admin"), ["issued", "cancelled"]);
  assert.equal(
    isInvoiceStatusTransitionAllowed({
      currentStatus: "issued",
      nextStatus: "paid",
      role: "admin"
    }),
    true
  );
});
