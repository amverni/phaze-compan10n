import type { CalendarDate, DateRule, Weekday } from "./types";

const DAY_MS = 86_400_000;

export function localCalendarDate(date: Date): CalendarDate {
  const calendarDate = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
  calendarOrdinal(calendarDate);
  return calendarDate;
}

const WEEKDAY_NUMBERS: Readonly<Record<Weekday, number>> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function weekdayNumber(weekday: Weekday): number {
  return WEEKDAY_NUMBERS[weekday];
}

function ordinalWeekday(ordinal: number): number {
  return (((ordinal + 4) % 7) + 7) % 7;
}

export function calendarOrdinal(date: CalendarDate, fieldPath = "date"): number {
  const value = new Date(0);
  value.setUTCFullYear(date.year, date.month - 1, date.day);
  if (
    !Number.isInteger(date.year) ||
    !Number.isInteger(date.month) ||
    !Number.isInteger(date.day) ||
    value.getUTCFullYear() !== date.year ||
    value.getUTCMonth() + 1 !== date.month ||
    value.getUTCDate() !== date.day
  ) {
    throw new Error(`${fieldPath}: expected a valid Gregorian calendar date`);
  }
  return value.getTime() / DAY_MS;
}

export function parseMonthDay(
  value: string,
  fieldPath: string,
): Readonly<Pick<CalendarDate, "month" | "day">> {
  if (value.length !== 5 || !/^\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${fieldPath}: expected MM-DD`);
  }
  const [month, day] = value.split("-").map(Number);
  calendarOrdinal({ year: 2000, month, day }, fieldPath);
  return { month, day };
}

export function parseFullDate(value: string, fieldPath: string): CalendarDate {
  if (value.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${fieldPath}: expected YYYY-MM-DD`);
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = { year, month, day };
  calendarOrdinal(date, fieldPath);
  return date;
}

function anchorOrdinal(
  rule: Extract<DateRule, { kind: "annual-weekday-window" }>,
  year: number,
): number | undefined {
  const first = calendarOrdinal({ year, month: rule.month, day: 1 });
  const last =
    calendarOrdinal({
      year: rule.month === 12 ? year + 1 : year,
      month: rule.month === 12 ? 1 : rule.month + 1,
      day: 1,
    }) - 1;
  const weekday = weekdayNumber(rule.weekday);
  if (rule.occurrence === "last") {
    return last - ((ordinalWeekday(last) - weekday + 7) % 7);
  }
  const anchor = first + ((weekday - ordinalWeekday(first) + 7) % 7) + (rule.occurrence - 1) * 7;
  return anchor <= last ? anchor : undefined;
}

export function matchesDateRule(rule: DateRule, date: CalendarDate): boolean {
  const ordinal = calendarOrdinal(date);
  if (
    rule.weekdays &&
    !rule.weekdays.some((weekday) => weekdayNumber(weekday) === ordinalWeekday(ordinal))
  ) {
    return false;
  }
  if (rule.kind === "annual-weekday-window") {
    return [date.year - 1, date.year, date.year + 1].some((year) => {
      const anchor = anchorOrdinal(rule, year);
      return (
        anchor !== undefined &&
        ordinal >= anchor + rule.fromOffset &&
        ordinal <= anchor + rule.throughOffset
      );
    });
  }
  if (rule.kind === "date") {
    return ordinal === calendarOrdinal(parseFullDate(rule.on, "on"));
  }
  if (rule.kind === "range") {
    const from = calendarOrdinal(parseFullDate(rule.from, "from"));
    const through = calendarOrdinal(parseFullDate(rule.through, "through"));
    return ordinal >= from && ordinal <= through;
  }
  if (rule.kind === "annual-range") {
    const from = parseMonthDay(rule.from, "from");
    const through = parseMonthDay(rule.through, "through");
    const start = from.month * 100 + from.day;
    const end = through.month * 100 + through.day;
    const current = date.month * 100 + date.day;
    return start <= end ? current >= start && current <= end : current >= start || current <= end;
  }
  if (rule.kind !== "annual-date") return false;
  const { month, day } = parseMonthDay(rule.on, "on");
  return date.month === month && date.day === day;
}
