import assert from "node:assert/strict";
import test from "node:test";
import { buildExpectedWeekStarts, getMonthEnd, summarizeWeeklyRevenue } from "./work-log-approval.utils.js";

test("buildExpectedWeekStarts returns overlapping project weeks within month bounds", () => {
  const result = buildExpectedWeekStarts({
    monthStart: "2026-07-01",
    projectStartDate: "2026-07-10",
    projectDueDate: "2026-07-24",
    today: "2026-07-31"
  });

  assert.deepEqual(result, ["2026-07-06", "2026-07-13", "2026-07-20"]);
});

test("buildExpectedWeekStarts stops at today for an active current month", () => {
  const result = buildExpectedWeekStarts({
    monthStart: "2026-07-01",
    projectStartDate: "2026-07-01",
    projectDueDate: null,
    today: "2026-07-17"
  });

  assert.deepEqual(result, ["2026-06-29", "2026-07-06", "2026-07-13"]);
});

test("summarizeWeeklyRevenue groups totals by week", () => {
  const result = summarizeWeeklyRevenue([
    { weekStart: "2026-07-06", lineTotal: 100 },
    { weekStart: "2026-07-06", lineTotal: 40 },
    { weekStart: "2026-07-13", lineTotal: 80 }
  ]);

  assert.deepEqual(result, [
    {
      weekStart: "2026-07-06",
      weekEnd: "2026-07-12",
      totalRevenue: 140
    },
    {
      weekStart: "2026-07-13",
      weekEnd: "2026-07-19",
      totalRevenue: 80
    }
  ]);
});

test("getMonthEnd returns the last day of the month", () => {
  assert.equal(getMonthEnd("2026-02-01"), "2026-02-28");
});
