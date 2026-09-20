import { afterEach, expect, it, vi } from "vitest";
import { readCapacity, updatePerson } from "./capacity";

afterEach(() => vi.unstubAllGlobals());

it("groups unordered API rows by person and aligns allocations to sorted weeks", async () => {
  const row = (
    personId: number,
    weekStart: string,
    allocatedHours: number,
  ) => ({
    personId,
    name: `Person ${personId}`,
    weeklyHours: 40,
    weekStart,
    from: weekStart,
    to: weekStart === "2025-12-29" ? "2026-01-04" : "2026-01-11",
    workdays: 5,
    allocatedHours,
    capacityHours: 40,
  });
  const fetch = vi
    .fn()
    .mockResolvedValue(
      Response.json([
        row(2, "2026-01-05", 12.5),
        row(1, "2025-12-29", 35),
        row(2, "2025-12-29", 0),
        row(1, "2026-01-05", 45),
      ]),
    );
  vi.stubGlobal("fetch", fetch);
  const signal = new AbortController().signal;
  const result = await readCapacity(
    { from: "2025-12-29", to: "2026-01-11" },
    signal,
  );
  expect(fetch).toHaveBeenCalledWith(
    "/api/capacity?from=2025-12-29&to=2026-01-11",
    { signal },
  );
  expect(result.weeks.map((week) => week.start)).toEqual([
    "2025-12-29",
    "2026-01-05",
  ]);
  expect(result.people).toEqual([
    { id: 1, name: "Person 1", weeklyHours: 40, allocations: [35, 45] },
    { id: 2, name: "Person 2", weeklyHours: 40, allocations: [0, 12.5] },
  ]);
});

it("keeps clipped week headings when the server returns no people", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([])));
  expect(await readCapacity({ from: "2026-01-06", to: "2026-01-08" })).toEqual({
    weeks: [
      {
        start: "2026-01-05",
        from: "2026-01-06",
        to: "2026-01-08",
        workdays: 3,
      },
    ],
    people: [],
  });
});

it("sends the PATCH contract and uses confirmed hours without losing the name", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(Response.json({ id: 7, weekly_hours: 32.5 }));
  vi.stubGlobal("fetch", fetch);
  const result = await updatePerson({ id: 7, name: "Ana", weeklyHours: 32 });
  expect(fetch).toHaveBeenCalledWith("/api/people/7", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weekly_hours: 32 }),
  });
  expect(result).toEqual({ id: 7, name: "Ana", weeklyHours: 32.5 });
});

it("rejects HTTP errors instead of treating them as successful reads or saves", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response(" unavailable \n", { status: 503 }))
      .mockResolvedValueOnce(new Response("person not found", { status: 404 })),
  );
  await expect(
    readCapacity({ from: "2026-01-05", to: "2026-01-11" }),
  ).rejects.toThrow("unavailable");
  await expect(
    updatePerson({ id: 7, name: "Ana", weeklyHours: 32 }),
  ).rejects.toThrow("person not found");
});
