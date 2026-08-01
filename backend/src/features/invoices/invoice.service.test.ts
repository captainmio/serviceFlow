import assert from "node:assert/strict";
import test from "node:test";
import {
  getAllowedInvoiceStatusTransitions,
  canDeleteInvoiceDraft,
  canEditInvoiceDraft,
  canRejectInvoiceDraft,
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

test("only managers can reject invoice drafts awaiting review", () => {
  assert.equal(canRejectInvoiceDraft("draft", "manager"), true);
  assert.equal(canRejectInvoiceDraft("draft", "admin"), false);
  assert.equal(canRejectInvoiceDraft("rejected", "manager"), false);
});

test("resubmitted invoice drafts cannot be edited again", () => {
  assert.equal(canEditInvoiceDraft("draft", null, "admin"), true);
  assert.equal(canEditInvoiceDraft("rejected", null, "admin"), true);
  assert.equal(canEditInvoiceDraft("draft", new Date(), "admin"), false);
  assert.equal(canEditInvoiceDraft("reviewed", null, "admin"), false);
});

test("only approved project months can be used for invoice drafts", () => {
  assert.equal(isProjectMonthInvoiceEligible("approved"), true);
  assert.equal(isProjectMonthInvoiceEligible("pending"), false);
  assert.equal(isProjectMonthInvoiceEligible("rejected"), false);
});
