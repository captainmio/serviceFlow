import assert from "node:assert/strict";
import test from "node:test";
import { workLogLineReviewSchema } from "./project-approval.schemas.js";

test("project approval schema accepts pending when clearing a review", () => {
  const result = workLogLineReviewSchema.safeParse({
    status: "pending",
    rejectionReason: null
  });

  assert.equal(result.success, true);
});

test("project approval schema still requires a reason for rejection", () => {
  const result = workLogLineReviewSchema.safeParse({
    status: "rejected",
    rejectionReason: ""
  });

  assert.equal(result.success, false);
});
