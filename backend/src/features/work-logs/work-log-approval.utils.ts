import { formatLocalDate, getWeekEnd, getWeekStart } from "./work-log.utils.js";

export interface ExpectedWeekRangeInput {
  monthStart: string;
  projectStartDate: string | null;
  projectDueDate: string | null;
  today?: string;
}

export interface WeeklyRevenueSummary {
  weekStart: string;
  weekEnd: string;
  totalRevenue: number;
}

const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

export const getMonthEnd = (monthStart: string) => {
  const year = Number(monthStart.slice(0, 4));
  const month = Number(monthStart.slice(5, 7));
  return formatLocalDate(new Date(year, month, 0));
};

const getMinDate = (values: string[]) => values.slice().sort()[0] ?? "";
const getMaxDate = (values: string[]) => values.slice().sort().at(-1) ?? "";

export const buildExpectedWeekStarts = ({
  monthStart,
  projectStartDate,
  projectDueDate,
  today
}: ExpectedWeekRangeInput) => {
  const monthEnd = getMonthEnd(monthStart);
  const activeStart = getMaxDate([monthStart, projectStartDate ?? monthStart]);
  const activeEnd = getMinDate([projectDueDate ?? monthEnd, monthEnd, today ?? monthEnd]);

  if (!activeStart || !activeEnd || activeStart > activeEnd) {
    return [];
  }

  const firstWeekStart = getWeekStart(activeStart);
  const weekStarts: string[] = [];
  const cursor = new Date(`${firstWeekStart}T00:00:00`);

  while (formatLocalDate(cursor) <= activeEnd) {
    weekStarts.push(formatLocalDate(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  return weekStarts;
};

export const summarizeWeeklyRevenue = (
  workLogs: Array<{ weekStart: string; lineTotal: number }>
): WeeklyRevenueSummary[] => {
  const totals = new Map<string, number>();

  workLogs.forEach((workLog) => {
    totals.set(workLog.weekStart, roundToTwoDecimals((totals.get(workLog.weekStart) ?? 0) + workLog.lineTotal));
  });

  return Array.from(totals.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([weekStart, totalRevenue]) => ({
      weekStart,
      weekEnd: getWeekEnd(weekStart),
      totalRevenue
    }));
};

