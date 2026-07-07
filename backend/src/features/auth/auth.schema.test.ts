import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema } from "./auth.schema.js";

test("login schema accepts a valid email and password", () => {
  const parsed = loginSchema.parse({
    email: "admin@serviceflow.local",
    password: "ChangeMe123!"
  });

  assert.equal(parsed.email, "admin@serviceflow.local");
});

test("login schema rejects invalid email payloads", () => {
  assert.throws(() =>
    loginSchema.parse({
      email: "not-an-email",
      password: "ChangeMe123!"
    })
  );
});
