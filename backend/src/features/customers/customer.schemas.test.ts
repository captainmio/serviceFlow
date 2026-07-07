import assert from "node:assert/strict";
import test from "node:test";
import { customerListQuerySchema, customerPayloadSchema } from "./customer.schemas.js";

test("customer payload schema accepts a valid customer", () => {
  const parsed = customerPayloadSchema.parse({
    companyName: "Northline Dental",
    contactPerson: "Mara White",
    email: "hello@northline.test",
    phone: "555-2100",
    address: "42 Main Street",
    status: "active"
  });

  assert.equal(parsed.companyName, "Northline Dental");
});

test("customer query schema accepts search and status", () => {
  const parsed = customerListQuerySchema.parse({
    search: "north",
    status: "inactive"
  });

  assert.equal(parsed.status, "inactive");
});

test("customer payload schema rejects invalid status", () => {
  assert.throws(() =>
    customerPayloadSchema.parse({
      companyName: "Northline Dental",
      contactPerson: "Mara White",
      email: "hello@northline.test",
      phone: "555-2100",
      address: "42 Main Street",
      status: "archived"
    })
  );
});
