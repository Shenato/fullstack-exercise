export type DateRange = { from: string; to: string }
export type SprintSettings = { weeks: number; anchor: string }
export type DisplayUnit = 'hours' | 'percent'
export type CapacityWeek = DateRange & { start: string; workdays: number }
export type Person = { id: number; name: string; weeklyHours: number }
export type CapacityRow = Person & { allocations: number[] }
export type CapacityData = { weeks: CapacityWeek[]; people: CapacityRow[] }