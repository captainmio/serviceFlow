import assert from "node:assert/strict";
import test from "node:test";
import {
  assertHoursWithinLimits,
  calculateLineTotal,
  getMonthEnd,
  getMonthVisibleWeekRange,
  getMonthStart,
  getWeekMonthOverlapRange,
  getWeekEnd,
  getWeekStart,
  WorkLogLimitError
} from "./work-log.utils.js";

test("work log line total uses hours multiplied by hourly rate", () => {
  assert.equal(calculateLineTotal(4, 85), 340);
  assert.equal(calculateLineTotal(3.5, 112.5), 393.75);
});

test("work log week grouping starts on Monday", () => {
  assert.equal(getWeekStart("2026-07-09"), "2026-07-06");
  assert.equal(getWeekEnd("2026-07-06"), "2026-07-12");
  assert.equal(getMonthStart("2026-07-09"), "2026-07-01");
  assert.equal(getMonthEnd("2026-07-01"), "2026-07-31");
});

test("week month overlap range returns only the selected month portion", () => {
  assert.deepEqual(getWeekMonthOverlapRange("2026-07-27", "2026-07-01"), {
    start: "2026-07-27",
    end: "2026-07-31"
  });
  assert.deepEqual(getWeekMonthOverlapRange("2026-07-27", "2026-08-01"), {
    start: "2026-08-01",
    end: "2026-08-02"
  });
});

test("month visible week range keeps overlapping boundary days visible", () => {
  assert.deepEqual(getMonthVisibleWeekRange("2026-07-01"), {
    start: "2026-06-29",
    end: "2026-08-02"
  });

  assert.deepEqual(getMonthVisibleWeekRange("2026-08-01"), {
    start: "2026-07-27",
    end: "2026-09-06"
  });
});

test("daily and weekly limits reject overages", () => {
  assert.throws(
    () =>
      assertHoursWithinLimits({
        hours: 5,
        existingDayHours: 4,
        existingWeekHours: 12,
        maxDayHours: 8,
        maxWeekHours: 40
      }),
    WorkLogLimitError
  );

  assert.throws(
    () =>
      assertHoursWithinLimits({
        hours: 10,
        existingDayHours: 2,
        existingWeekHours: 35,
        maxDayHours: 12,
        maxWeekHours: 40
      }),
    WorkLogLimitError
  );
});
