import { getWeeks } from "../lib/calendar";
import type {
  CapacityData,
  CapacityRow,
  CapacityWeek,
  DateRange,
  Person,
} from "../types/capacity";

type CapacityResult = {
  personId: number;
  name: string;
  weeklyHours: number;
  weekStart: string;
  from: string;
  to: string;
  workdays: number;
  allocatedHours: number;
  capacityHours: number;
};

async function checkResponse(response: Response): Promise<void> {
  if (!response.ok) {
    const message = (await response.text()).trim();
    throw new Error(message || `Request failed (${response.status}).`);
  }
}

export async function readCapacity(
  range: DateRange,
  signal?: AbortSignal,
): Promise<CapacityData> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  const response = await fetch(`/api/capacity?${params}`, { signal });
  await checkResponse(response);
  const results: CapacityResult[] = await response.json();
  const weekMap = new Map<string, CapacityWeek>();
  for (const row of results) {
    weekMap.set(row.weekStart, {
      start: row.weekStart,
      from: row.from,
      to: row.to,
      workdays: row.workdays,
    });
  }
  const weeks =
    results.length === 0
      ? getWeeks(range)
      : Array.from(weekMap.values()).sort((first, second) =>
          first.start.localeCompare(second.start),
        );
  const weekIndexes = new Map(weeks.map((week, index) => [week.start, index]));
  const people = new Map<number, CapacityRow>();
  for (const row of results) {
    let person = people.get(row.personId);
    if (!person) {
      person = {
        id: row.personId,
        name: row.name,
        weeklyHours: row.weeklyHours,
        allocations: Array(weeks.length).fill(0),
      };
      people.set(person.id, person);
    }
    person.allocations[weekIndexes.get(row.weekStart)!] = row.allocatedHours;
  }
  return {
    weeks,
    people: Array.from(people.values()).sort(
      (first, second) => first.id - second.id,
    ),
  };
}

export async function updatePerson(person: Person): Promise<Person> {
  const response = await fetch(`/api/people/${person.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weekly_hours: person.weeklyHours }),
  });
  await checkResponse(response);
  const updated: { id: number; weekly_hours: number } = await response.json();
  return { ...person, id: updated.id, weeklyHours: updated.weekly_hours };
}
