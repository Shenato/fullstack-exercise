import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  daysBetween,
  getWeeks,
  parseDate,
  rangeError,
  readSettings,
  SETTINGS_KEY,
  sprintRange,
  weekCapacity,
} from "./calendar";

afterEach(() => vi.unstubAllGlobals());

describe("capacity calendar rules", () => {
  it("clips both boundary weeks across a year without counting weekends", () => {
    expect(getWeeks({ from: "2025-12-31", to: "2026-01-06" })).toEqual([
      {
        start: "2025-12-29",
        from: "2025-12-31",
        to: "2026-01-04",
        workdays: 3,
      },
      {
        start: "2026-01-05",
        from: "2026-01-05",
        to: "2026-01-06",
        workdays: 2,
      },
    ]);
    expect(getWeeks({ from: "2026-01-10", to: "2026-01-11" })[0].workdays).toBe(
      0,
    );
    expect(weekCapacity(40, 3)).toBe(24);
    expect(weekCapacity(40, 0)).toBe(0);
    expect(weekCapacity(0, 5)).toBe(0);
  });

  it("does not round a fractional capacity into a false at-capacity result", () => {
    const capacity = weekCapacity(0.83, 3);
    expect(capacity).toBe(0.498);
    expect(0.5).toBeGreaterThan(capacity);
  });

  it("rejects invalid dates and enforces the inclusive range limit", () => {
    expect(parseDate("2026-02-29")).toBeNull();
    expect(parseDate("2026-1-05")).toBeNull();
    expect(parseDate("2024-02-29")?.toISOString()).toBe(
      "2024-02-29T00:00:00.000Z",
    );
    expect(rangeError({ from: "2026-01-02", to: "2026-01-01" })).not.toBeNull();
    expect(rangeError({ from: "2025-12-29", to: "2026-06-28" })).toBeNull();
    expect(rangeError({ from: "2025-12-29", to: "2026-06-29" })).not.toBeNull();
  });

  it("keeps UTC day arithmetic stable across a daylight-saving boundary", () => {
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09");
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2);
    expect(addDays("2026-11-01", -1)).toBe("2026-10-31");
  });

  it("finds the correct sprint before the anchor and on its end boundary", () => {
    const settings = { weeks: 2, anchor: "2026-01-05" };
    expect(sprintRange(settings, "2026-01-04")).toEqual({
      from: "2025-12-22",
      to: "2026-01-04",
    });
    expect(sprintRange(settings, "2026-01-18")).toEqual({
      from: "2026-01-05",
      to: "2026-01-18",
    });
    expect(sprintRange(settings, "2026-01-19")).toEqual({
      from: "2026-01-19",
      to: "2026-02-01",
    });
  });

  it("loads valid sprint preferences and safely falls back for corrupt or blocked storage", () => {
    const getItem = vi
      .fn()
      .mockReturnValue(JSON.stringify({ weeks: 3, anchor: "2026-01-05" }));
    vi.stubGlobal("localStorage", { getItem });
    expect(readSettings()).toEqual({ weeks: 3, anchor: "2026-01-05" });
    expect(getItem).toHaveBeenCalledWith(SETTINGS_KEY);
    for (const stored of [
      "broken JSON",
      '{"weeks":0,"anchor":"2026-01-05"}',
      '{"weeks":2,"anchor":"2026-01-06"}',
    ]) {
      getItem.mockReturnValue(stored);
      expect(readSettings()).toEqual({ weeks: 2, anchor: "2026-01-05" });
    }
    getItem.mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    expect(readSettings()).toEqual({ weeks: 2, anchor: "2026-01-05" });
  });
});
