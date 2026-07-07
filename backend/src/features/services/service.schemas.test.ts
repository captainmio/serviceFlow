import assert from "node:assert/strict";
import test from "node:test";
import { serviceListQuerySchema, servicePayloadSchema } from "./service.schemas.js";

test("service payload schema accepts a valid service", () => {
  const parsed = servicePayloadSchema.parse({
    name: "Website maintenance",
    description: "Monthly site support and uptime checks",
    defaultHourlyRate: 120,
    status: "active"
  });

  assert.equal(parsed.name, "Website maintenance");
});

test("service query schema accepts search and status", () => {
  const parsed = serviceListQuerySchema.parse({
    search: "support",
    status: "inactive"
  });

  assert.equal(parsed.status, "inactive");
});

test("service payload schema rejects empty service name", () => {
  assert.throws(() =>
    servicePayloadSchema.parse({
      name: "",
      description: "",
      defaultHourlyRate: 120,
      status: "active"
    })
  );
});
