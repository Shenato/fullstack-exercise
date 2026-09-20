import {
  addDays,
  daysBetween,
  getWeeks,
  monday,
  parseDate,
} from "../lib/calendar";
import type { CapacityData, DateRange, Person } from "../types/capacity";

const people: Person[] = [
  { id: 1, name: "Ana Ferreira", weeklyHours: 40 },
  { id: 2, name: "Bo Lindqvist", weeklyHours: 40 },
  { id: 3, name: "Cem Aydin", weeklyHours: 20 },
  { id: 4, name: "Dee Okafor", weeklyHours: 40 },
  { id: 5, name: "Eli Nakamura", weeklyHours: 0 },
  { id: 6, name: "Sanne Virtanen", weeklyHours: 32 },
  { id: 7, name: "Tobias Hagen", weeklyHours: 24 },
  { id: 8, name: "Maya Chen", weeklyHours: 40 },
  { id: 9, name: "Leo Martin", weeklyHours: 40 },
  { id: 10, name: "Nora Ali", weeklyHours: 32 },
  { id: 11, name: "Oliver Berg", weeklyHours: 40 },
  { id: 12, name: "Rosa Silva", weeklyHours: 20 },
];
const dailyHours = [6, 9, 5, 8, 1, 5, 6, 7.5, 0, 6, 7, 3];

function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted)
      return reject(new DOMException("Aborted", "AbortError"));
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

export async function readCapacity(
  range: DateRange,
  signal?: AbortSignal,
): Promise<CapacityData> {
  await delay(250, signal);
  const weeks = getWeeks(range);
  return {
    weeks,
    people: people.map((person) => ({
      ...person,
      allocations: weeks.map((week) => {
        let hours = 0;
        for (let day = week.from; day <= week.to; day = addDays(day, 1)) {
          const weekday = parseDate(day)!.getUTCDay();
          if (weekday === 0 || weekday === 6) continue;
          const weekIndex = daysBetween("2026-01-05", monday(day)) / 7;
          const variation =
            person.id === 4 || person.id === 5 || person.id === 9
              ? 0
              : ((((weekIndex + person.id) % 3) + 3) % 3) * 0.5;
          hours += dailyHours[person.id - 1] + variation;
        }
        return hours;
      }),
    })),
  };
}

export async function updatePerson(
  id: number,
  weeklyHours: number,
): Promise<Person> {
  await delay(450);
  if (!Number.isFinite(weeklyHours) || weeklyHours < 0 || weeklyHours > 168) {
    throw new Error("Enter weekly hours between 0 and 168.");
  }
  const person = people.find((candidate) => candidate.id === id);
  if (!person) throw new Error("Person not found.");
  person.weeklyHours = Math.round(weeklyHours * 100) / 100;
  return { ...person };
}
