import assert from "node:assert/strict";
import test from "node:test";
import {
  computeCanFinalize,
  computeQueueResolved,
  canMutateProjectApproval,
  filterApprovalQueueEntries,
  filterRevenueEligibleWorkLogs,
  filterSubmittedWorkLogs,
  resetProjectApprovalPeriod
} from "./project-approval.service.js";
import type { WorkLogPeriod } from "../../entities/work-log-period.entity.js";

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

test("filterSubmittedWorkLogs hides entries from unsubmitted weeks", () => {
  const submitted = filterSubmittedWorkLogs(
    [
      {
        job: { id: "project-1" },
        user: { uuid: "user-1" },
        workDate: "2026-07-07"
      },
      {
        job: { id: "project-1" },
        user: { uuid: "user-1" },
        workDate: "2026-07-14"
      }
    ],
    new Set(["project-1:user-1:2026-07-06:2026-07-01"])
  );

  assert.equal(submitted.length, 1);
  assert.equal(submitted[0]?.workDate, "2026-07-07");
});

test("filterApprovalQueueEntries hides projects with no submitted work logs", () => {
  const visibleEntries = filterApprovalQueueEntries([
    { summary: { lineItemCount: 0 } },
    { summary: { lineItemCount: 2 } }
  ]);

  assert.equal(visibleEntries.length, 1);
  assert.equal(visibleEntries[0]?.summary.lineItemCount, 2);
});

test("only managers can mutate project approvals", () => {
  assert.equal(canMutateProjectApproval("manager"), true);
  assert.equal(canMutateProjectApproval("admin"), false);
  assert.equal(canMutateProjectApproval("team_member"), false);
});

test("cancelling approval resets the project month to pending", () => {
  const period = {
    status: "approved",
    reviewedBy: {},
    reviewedAt: new Date(),
    rejectionReason: "old reason"
  } as WorkLogPeriod;

  resetProjectApprovalPeriod(period);

  assert.equal(period.status, "pending");
  assert.equal(period.reviewedBy, null);
  assert.equal(period.reviewedAt, null);
  assert.equal(period.rejectionReason, null);
});
