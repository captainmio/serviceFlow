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

test("login schema accepts username-style login values", () => {
  const parsed = loginSchema.parse({
    email: "admin",
    password: "admin"
  });

  assert.equal(parsed.email, "admin");
});

test("login schema rejects empty username or email payloads", () => {
  assert.throws(() =>
    loginSchema.parse({
      email: "   ",
      password: "admin"
    })
  );
});
