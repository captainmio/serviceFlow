export class WorkLogLimitError extends Error {}

const roundToTwoDecimals = (value: number) => Math.round(value * 100) / 100;

export const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const calculateLineTotal = (hours: number, hourlyRate: number) =>
  roundToTwoDecimals(hours * hourlyRate);

export const getWeekStart = (dateValue: string) => {
  const date = new Date(`${dateValue}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return formatLocalDate(date);
};

export const getMonthStart = (dateValue: string) => `${dateValue.slice(0, 7)}-01`;

export const assertHoursWithinLimits = ({
  hours,
  existingDayHours,
  existingWeekHours,
  maxDayHours,
  maxWeekHours
}: {
  hours: number;
  existingDayHours: number;
  existingWeekHours: number;
  maxDayHours: number;
  maxWeekHours: number;
}) => {
  const totalDayHours = roundToTwoDecimals(existingDayHours + hours);
  const totalWeekHours = roundToTwoDecimals(existingWeekHours + hours);

  if (totalDayHours > maxDayHours) {
    throw new WorkLogLimitError(
      `Reported hours exceed the daily maximum of ${maxDayHours} for this team member`
    );
  }

  if (totalWeekHours > maxWeekHours) {
    throw new WorkLogLimitError(
      `Reported hours exceed the weekly maximum of ${maxWeekHours} for this team member`
    );
  }
};
