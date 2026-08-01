import assert from "node:assert/strict";
import test from "node:test";
import {
  getAllowedInvoiceStatusTransitions,
  canDeleteInvoiceDraft,
  isInvoiceStatusTransitionAllowed,
  isProjectMonthInvoiceEligible
} from "./invoice.service.js";

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
  assert.deepEqual(getAllowedInvoiceStatusTransitions("reviewed", "admin"), ["issued"]);
  assert.equal(
    isInvoiceStatusTransitionAllowed({
      currentStatus: "issued",
      nextStatus: "paid",
      role: "admin"
    }),
    true
  );
});

test("only admins can delete invoice drafts", () => {
  assert.equal(canDeleteInvoiceDraft("draft", "admin"), true);
  assert.equal(canDeleteInvoiceDraft("draft", "manager"), false);
  assert.equal(canDeleteInvoiceDraft("reviewed", "admin"), false);
  assert.equal(
    isInvoiceStatusTransitionAllowed({
      currentStatus: "draft",
      nextStatus: "cancelled",
      role: "manager"
    }),
    false
  );
});

test("only approved project months can be used for invoice drafts", () => {
  assert.equal(isProjectMonthInvoiceEligible("approved"), true);
  assert.equal(isProjectMonthInvoiceEligible("pending"), false);
  assert.equal(isProjectMonthInvoiceEligible("rejected"), false);
});
