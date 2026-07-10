import assert from "node:assert/strict";
import test from "node:test";
import {
  computeCanFinalize,
  computeQueueResolved,
  filterRevenueEligibleWorkLogs
} from "./project-approval.service.js";

const createLine = (reviewStatus: "pending" | "approved" | "rejected") =>
  ({ reviewStatus }) as { reviewStatus: "pending" | "approved" | "rejected" };

test("computeCanFinalize allows finalizing when all lines are reviewed, including rejected lines", () => {
  const canFinalize = computeCanFinalize({
    lineItems: [createLine("approved"), createLine("rejected")],
    periodStatus: "pending"
  });

  assert.equal(canFinalize, true);
});

test("computeCanFinalize allows finalizing when some lines are still pending", () => {
  const canFinalize = computeCanFinalize({
    lineItems: [createLine("approved"), createLine("pending")],
    periodStatus: "pending"
  });

  assert.equal(canFinalize, true);
});

test("computeQueueResolved hides approved months only after every assigned member has submitted", () => {
  const isResolved = computeQueueResolved({
    lineItems: [createLine("approved")],
    memberStates: [{ missingWeekStarts: [] }, { missingWeekStarts: [] }],
    periodStatus: "approved"
  });

  assert.equal(isResolved, true);
});

test("computeQueueResolved keeps approved months visible while any assigned member is still incomplete", () => {
  const isResolved = computeQueueResolved({
    lineItems: [createLine("approved")],
    memberStates: [{ missingWeekStarts: [] }, { missingWeekStarts: ["2026-07-06"] }],
    periodStatus: "approved"
  });

  assert.equal(isResolved, false);
});

test("filterRevenueEligibleWorkLogs keeps only submitted approved lines", () => {
  const eligible = filterRevenueEligibleWorkLogs(
    [
      {
        job: { id: "project-1" },
        user: { uuid: "user-1" },
        workDate: "2026-07-07",
        reviewStatus: "approved"
      },
      {
        job: { id: "project-1" },
        user: { uuid: "user-1" },
        workDate: "2026-07-08",
        reviewStatus: "rejected"
      },
      {
        job: { id: "project-1" },
        user: { uuid: "user-2" },
        workDate: "2026-07-09",
        reviewStatus: "approved"
      },
      {
        job: { id: "project-1" },
        user: { uuid: "user-1" },
        workDate: "2026-07-10",
        reviewStatus: "pending"
      }
    ],
    new Set(["project-1:user-1:2026-07-06:2026-07-01", "project-1:user-1:2026-07-06:2026-08-01"])
  );

  assert.equal(eligible.length, 1);
  assert.equal(eligible[0]?.user.uuid, "user-1");
  assert.equal(eligible[0]?.reviewStatus, "approved");
});
