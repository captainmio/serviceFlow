import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_MAX_AGE_MS
} from "./auth.service.js";

test("access token cookie lifetime stays at 15 minutes", () => {
  assert.equal(ACCESS_TOKEN_MAX_AGE_MS, 15 * 60 * 1000);
});

test("refresh token cookie lifetime stays at 12 hours", () => {
  assert.equal(REFRESH_TOKEN_MAX_AGE_MS, 12 * 60 * 60 * 1000);
});
