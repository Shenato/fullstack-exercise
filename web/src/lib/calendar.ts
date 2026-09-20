import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isoWeek from "dayjs/plugin/isoWeek";
import type {
  CapacityWeek,
  DateRange,
  SprintSettings,
} from "../types/capacity";

dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);

const DATE_FORMAT = "YYYY-MM-DD";
export const MAX_RANGE_DAYS = 182;
export const SETTINGS_KEY = "capacity.sprint-settings.v1";

export function parseDate(value: string): Date | null {
  const date = dayjs.utc(value, DATE_FORMAT, true);
  return date.isValid() ? date.toDate() : null;
}

export function isoDate(date: Date): string {
  return dayjs.utc(date).format(DATE_FORMAT);
}

export function today(): string {
  return dayjs().format(DATE_FORMAT);
}

export function addDays(value: string, days: number): string {
  const date = parseDate(value);
  if (!date) throw new Error("Invalid date");
  return dayjs.utc(date).add(days, "day").format(DATE_FORMAT);
}

export function monday(value: string): string {
  const date = parseDate(value);
  if (!date) throw new Error("Invalid date");
  return dayjs.utc(date).startOf("isoWeek").format(DATE_FORMAT);
}

export function daysBetween(from: string, to: string): number {
  const start = parseDate(from);
  const end = parseDate(to);
  if (!start || !end) throw new Error("Invalid date");
  return dayjs.utc(end).diff(dayjs.utc(start), "day");
}

export function rangeError(range: DateRange): string | null {
  if (!parseDate(range.from) || !parseDate(range.to))
    return "Choose valid start and end dates.";
  const days = daysBetween(range.from, range.to);
  if (days < 0) return "End date must be on or after start date.";
  if (days >= MAX_RANGE_DAYS) return "Select at most 26 weeks.";
  return null;
}

export function validSettings(value: unknown): value is SprintSettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Partial<SprintSettings>;
  return (
    typeof settings.weeks === "number" &&
    Number.isInteger(settings.weeks) &&
    settings.weeks >= 1 &&
    settings.weeks <= 8 &&
    typeof settings.anchor === "string" &&
    !!parseDate(settings.anchor) &&
    monday(settings.anchor) === settings.anchor
  );
}

export function readSettings(): SprintSettings {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) ?? "null",
    );
    if (validSettings(stored)) return stored;
  } catch {}
  return { weeks: 2, anchor: "2026-01-05" };
}

export function sprintRange(
  settings: SprintSettings,
  reference = today(),
): DateRange {
  const length = settings.weeks * 7;
  const offset =
    Math.floor(daysBetween(settings.anchor, reference) / length) * length;
  const from = addDays(settings.anchor, offset);
  return { from, to: addDays(from, length - 1) };
}

export function getWeeks(range: DateRange): CapacityWeek[] {
  const error = rangeError(range);
  if (error) throw new Error(error);
  const weeks: CapacityWeek[] = [];
  for (
    let start = monday(range.from);
    start <= range.to;
    start = addDays(start, 7)
  ) {
    const from = start < range.from ? range.from : start;
    const end = addDays(start, 6);
    const to = end > range.to ? range.to : end;
    let workdays = 0;
    for (let day = from; day <= to; day = addDays(day, 1)) {
      if (dayjs.utc(day).isoWeekday() <= 5) workdays++;
    }
    weeks.push({ start, from, to, workdays });
  }
  return weeks;
}

export function formatDate(value: string, year = false): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    ...(year ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(parseDate(value)!);
}

export function formatHours(value: number): string {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(
    value,
  );
}

export function weekCapacity(weeklyHours: number, workdays: number): number {
  return Math.round(((weeklyHours * workdays) / 5) * 100) / 100;
}
