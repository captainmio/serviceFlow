import assert from "node:assert/strict";
import test from "node:test";
import { CustomerDeleteBlockedError } from "./customer.service.js";

test("customer delete blocked error exposes the inactive guidance", () => {
  const error = new CustomerDeleteBlockedError();

  assert.match(
    error.message,
    /Set the customer to inactive instead\./
  );
});
