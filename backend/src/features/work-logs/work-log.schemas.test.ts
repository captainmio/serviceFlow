import assert from "node:assert/strict";
import test from "node:test";
import {
  workLogPayloadSchema,
  workLogPeriodReviewSchema,
  workLogWeekSubmissionSchema
} from "./work-log.schemas.js";

test("work log schema requires positive hours", () => {
  const result = workLogPayloadSchema.safeParse({
    jobServiceId: "550e8400-e29b-41d4-a716-446655440000",
    workDate: "2026-07-09",
    hours: 0,
    notes: ""
  });

  assert.equal(result.success, false);
});

test("work log period rejection requires a reason", () => {
  const result = workLogPeriodReviewSchema.safeParse({
    projectId: "550e8400-e29b-41d4-a716-446655440000",
    monthStart: "2026-07-01",
    status: "rejected",
    rejectionReason: ""
  });

  assert.equal(result.success, false);
});

test("work log week submission schema accepts a valid project and week", () => {
  const result = workLogWeekSubmissionSchema.safeParse({
    projectId: "550e8400-e29b-41d4-a716-446655440000",
    weekStart: "2026-07-06"
  });

  assert.equal(result.success, true);
});

test("work log schema accepts a valid update payload", () => {
  const result = workLogPayloadSchema.safeParse({
    jobServiceId: "550e8400-e29b-41d4-a716-446655440000",
    workDate: "2026-07-09",
    hours: 4,
    notes: "Updated daily work entry"
  });

  assert.equal(result.success, true);
});
