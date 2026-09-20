import type { CapacityWeek, DateRange, SprintSettings } from '../types/capacity'

const DAY = 86_400_000
export const MAX_RANGE_DAYS = 182
export const SETTINGS_KEY = 'capacity.sprint-settings.v1'

export function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function today(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function addDays(value: string, days: number): string {
  const date = parseDate(value)
  if (!date) throw new Error('Invalid date')
  date.setUTCDate(date.getUTCDate() + days)
  return isoDate(date)
}

export function monday(value: string): string {
  const date = parseDate(value)
  if (!date) throw new Error('Invalid date')
  return addDays(value, -((date.getUTCDay() + 6) % 7))
}

export function daysBetween(from: string, to: string): number {
  return (parseDate(to)!.getTime() - parseDate(from)!.getTime()) / DAY
}

export function rangeError(range: DateRange): string | null {
  if (!parseDate(range.from) || !parseDate(range.to)) return 'Choose valid start and end dates.'
  const days = daysBetween(range.from, range.to)
  if (days < 0) return 'End date must be on or after start date.'
  if (days >= MAX_RANGE_DAYS) return 'Select at most 26 weeks.'
  return null
}

export function validSettings(value: unknown): value is SprintSettings {
  if (!value || typeof value !== 'object') return false
  const settings = value as Partial<SprintSettings>
  return typeof settings.weeks === 'number' && Number.isInteger(settings.weeks)
    && settings.weeks >= 1 && settings.weeks <= 8
    && typeof settings.anchor === 'string' && !!parseDate(settings.anchor)
    && monday(settings.anchor) === settings.anchor
}

export function readSettings(): SprintSettings {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null')
    if (validSettings(stored)) return stored
  } catch {}
  return { weeks: 2, anchor: '2026-01-05' }
}

export function sprintRange(settings: SprintSettings, reference = today()): DateRange {
  const length = settings.weeks * 7
  const offset = Math.floor(daysBetween(settings.anchor, reference) / length) * length
  const from = addDays(settings.anchor, offset)
  return { from, to: addDays(from, length - 1) }
}

export function getWeeks(range: DateRange): CapacityWeek[] {
  const error = rangeError(range)
  if (error) throw new Error(error)
  const weeks: CapacityWeek[] = []
  for (let start = monday(range.from); start <= range.to; start = addDays(start, 7)) {
    const from = start < range.from ? range.from : start
    const end = addDays(start, 6)
    const to = end > range.to ? range.to : end
    let workdays = 0
    for (let day = from; day <= to; day = addDays(day, 1)) {
      const weekday = parseDate(day)!.getUTCDay()
      if (weekday !== 0 && weekday !== 6) workdays++
    }
    weeks.push({ start, from, to, workdays })
  }
  return weeks
}

export function formatDate(value: string, year = false): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}), timeZone: 'UTC',
  }).format(parseDate(value)!)
}

export function formatHours(value: number): string {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(value)
}

export function weekCapacity(weeklyHours: number, workdays: number): number {
  return Math.round(weeklyHours * workdays / 5 * 100) / 100
}