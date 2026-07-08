import assert from "node:assert/strict";
import test from "node:test";
import { userPayloadSchema } from "./user.schemas.js";

test("user payload schema accepts a valid team member payload", () => {
  const parsed = userPayloadSchema.parse({
    firstName: "Jamie",
    lastName: "Stone",
    title: "Field Engineer",
    email: "jamie@example.com",
    active: true,
    isLoginBlocked: false,
    startDate: "2026-07-08",
    endDate: null,
    role: "team_member",
    maxWorkHoursPerDay: 8,
    maxWorkHoursPerWeek: 40,
    password: "Password123"
  });

  assert.equal(parsed.maxWorkHoursPerWeek, 40);
});

test("user payload schema rejects weekly hours below daily hours", () => {
  assert.throws(() =>
    userPayloadSchema.parse({
      firstName: "Jamie",
      lastName: "Stone",
      title: "Field Engineer",
      email: "jamie@example.com",
      active: true,
      isLoginBlocked: false,
      startDate: "2026-07-08",
      endDate: null,
      role: "team_member",
      maxWorkHoursPerDay: 8,
      maxWorkHoursPerWeek: 6,
      password: "Password123"
    })
  );
});
