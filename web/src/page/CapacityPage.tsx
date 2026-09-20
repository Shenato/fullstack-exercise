import { lazy, Suspense, useState } from 'react'
import { Alert, Box, Button, Chip, IconButton, LinearProgress, Snackbar, Tooltip, Typography } from '@mui/material'
import SettingsOutlined from '@mui/icons-material/SettingsOutlined'
import ViewWeekOutlined from '@mui/icons-material/ViewWeekOutlined'
import Circle from '@mui/icons-material/Circle'
import { CapacityGrid } from '../components/ui/CapacityGrid'
import { CapacityControls } from '../container/CapacityControls'
import { useCapacity } from '../hooks/useCapacity'
import { addDays, formatHours, getWeeks, readSettings, SETTINGS_KEY, sprintRange, weekCapacity } from '../lib/calendar'
import type { DateRange, DisplayUnit, Person, SprintSettings as Settings } from '../types/capacity'

const SprintSettings = lazy(() => import('../container/SprintSettings').then(module => ({ default: module.SprintSettings })))
const WeeklyHoursEditor = lazy(() => import('../container/WeeklyHoursEditor').then(module => ({ default: module.WeeklyHoursEditor })))

export function CapacityPage() {
  const [settings, setSettings] = useState(readSettings)
  const [range, setRange] = useState(() => sprintRange(settings))
  const [custom, setCustom] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [search, setSearch] = useState('')
  const [overOnly, setOverOnly] = useState(false)
  const [unit, setUnit] = useState<DisplayUnit>('hours')
  const [automatic, setAutomatic] = useState(true)
  const [seconds, setSeconds] = useState(30)
  const [jitter] = useState(() => Math.random() * 3)
  const [storageError, setStorageError] = useState('')
  const [notice, setNotice] = useState('')
  const { query, mutation } = useCapacity(range, automatic ? seconds + jitter : false)
  const weeks = query.data?.weeks ?? getWeeks(range)
  const people = (query.data?.people ?? []).filter(person =>
    person.name.toLowerCase().includes(search.trim().toLowerCase())
      && (!overOnly || person.allocations.some((hours, index) => hours > weekCapacity(person.weeklyHours, weeks[index].workdays))),
  )
  const allocated = people.reduce((sum, person) => sum + person.allocations.reduce((total, hours) => total + hours, 0), 0)
  const capacity = people.reduce((sum, person) => sum + weeks.reduce((total, week) => total + weekCapacity(person.weeklyHours, week.workdays), 0), 0)
  const overallocated = people.filter(person => person.allocations.some((hours, index) => hours > weekCapacity(person.weeklyHours, weeks[index].workdays))).length
  const available = people.reduce((sum, person) => sum + weeks.reduce((total, week, index) => total + Math.max(0, weekCapacity(person.weeklyHours, week.workdays) - person.allocations[index]), 0), 0)

  function saveSettings(next: Settings) {
    setSettings(next)
    setRange(sprintRange(next, range.from))
    setCustom(false)
    setSettingsOpen(false)
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      setStorageError('')
      setNotice('Sprint settings saved')
    } catch {
      setStorageError('Browser storage is unavailable. Settings will reset when you reload.')
    }
  }

  function applyRange(next: DateRange) {
    setRange(next)
    setCustom(true)
  }

  return <>
    <Box component="header" className="app-header">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ViewWeekOutlined sx={{ color: 'primary.main', fontSize: 28 }} /><Typography sx={{ fontWeight: 700, fontSize: 20 }}>capacity<span className="brand-dot">.</span></Typography><Box className="header-divider" /><Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Team workspace</Typography></Box>
      <Chip label="Mock data" size="small" variant="outlined" sx={{ borderColor: '#dccfd8', fontSize: 11 }} />
    </Box>
    <Box component="main" className="capacity-page">
      <Box className="page-title-row">
        <Box><Typography className="eyebrow">TEAM PLANNING</Typography><Typography component="h1" sx={{ fontWeight: 700, fontSize: { xs: 26, sm: 32 }, lineHeight: 1.25 }}>Team capacity</Typography></Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{settings.weeks}-week sprints</Typography><Tooltip title="Sprint settings"><span><IconButton aria-label="Sprint settings" disabled={mutation.isPending} onClick={() => setSettingsOpen(true)} sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}><SettingsOutlined fontSize="small" /></IconButton></span></Tooltip></Box>
      </Box>
      {storageError && <Alert severity="warning" onClose={() => setStorageError('')} sx={{ mb: 2 }}>{storageError}</Alert>}
      <CapacityControls key={`${range.from}:${range.to}`} range={range} sprintWeeks={settings.weeks} custom={custom} search={search} overOnly={overOnly} unit={unit} automatic={automatic} seconds={seconds} busy={query.isFetching} disabled={mutation.isPending}
        onRange={applyRange} onNavigate={direction => {
          const length = settings.weeks * 7 * direction
          setRange({ from: addDays(range.from, length), to: addDays(range.to, length) })
        }} onCurrent={() => { setRange(sprintRange(settings)); setCustom(false) }} onSearch={setSearch} onOverOnly={setOverOnly} onUnit={setUnit} onAutomatic={setAutomatic} onSeconds={setSeconds} onRefresh={() => { if (!mutation.isPending) void query.refetch() }} />
      <Box component="section" aria-label="Capacity summary" className="summary-band">
        {[
          { label: 'People in view', value: String(people.length), detail: `${query.data?.people.length ?? 0} team members`, tone: 'text.primary' },
          { label: 'Allocated hours', value: `${formatHours(allocated)}h`, detail: `${formatHours(capacity)}h capacity`, tone: 'text.primary' },
          { label: 'Available hours', value: `${formatHours(available)}h`, detail: 'Across selected workdays', tone: 'success.main' },
          { label: 'Overallocated people', value: String(overallocated), detail: 'Above capacity in any week', tone: overallocated ? 'error.main' : 'text.primary' },
        ].map(metric => <Box key={metric.label} className="summary-item"><Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 0.75 }}>{metric.label}</Typography><Typography sx={{ fontSize: 28, fontWeight: 600, lineHeight: 1.2, color: metric.tone }}>{query.isPending ? '—' : metric.value}</Typography><Typography sx={{ color: 'text.secondary', fontSize: 11, mt: 0.75 }}>{query.isPending ? 'Loading' : metric.detail}</Typography></Box>)}
      </Box>
      <Box className="grid-topline"><Typography sx={{ fontSize: 13, fontWeight: 600 }}>Allocation by week</Typography><Typography role="status" aria-live="polite" sx={{ fontSize: 11, color: 'text.secondary' }}>{mutation.isPending ? 'Saving capacity...' : query.isFetching ? 'Refreshing...' : query.isError ? 'Refresh failed' : `${people.length} people · ${weeks.length} ${weeks.length === 1 ? 'week' : 'weeks'}`}</Typography></Box>
      <Box sx={{ height: 2 }}>{query.isFetching && <LinearProgress sx={{ height: 2 }} />}</Box>
      {query.isError && <Alert severity="error" action={<Button color="inherit" onClick={() => void query.refetch()}>Retry</Button>} sx={{ mb: 2 }}>Could not refresh capacity. {query.data ? 'Showing the last loaded values.' : query.error.message}</Alert>}
      <CapacityGrid weeks={weeks} people={people} unit={unit} loading={query.isPending} saving={mutation.isPending} onEdit={setEditingPerson} onClearFilters={() => { setSearch(''); setOverOnly(false) }} />
      <Box component="footer" className="grid-footer"><Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>{[{ color: '#217463', label: 'Available' }, { color: '#90723c', label: 'At capacity' }, { color: '#b83b43', label: 'Overallocated' }].map(item => <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Circle sx={{ fontSize: 7, color: item.color }} /><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{item.label}</Typography></Box>)}</Box><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Monday - Friday · Hours per selected week</Typography></Box>
    </Box>
    <Suspense fallback={null}>
      {settingsOpen && <SprintSettings settings={settings} onClose={() => setSettingsOpen(false)} onSave={saveSettings} />}
      {editingPerson && <WeeklyHoursEditor person={editingPerson} pending={mutation.isPending} onClose={() => setEditingPerson(null)} onSave={async person => { await mutation.mutateAsync(person); setEditingPerson(null); setNotice(`${person.name}'s capacity updated`) }} />}
    </Suspense>
    <Snackbar open={!!notice} autoHideDuration={3500} message={notice} onClose={() => setNotice('')} />
  </>
}