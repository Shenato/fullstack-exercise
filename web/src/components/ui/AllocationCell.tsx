import { Box, Typography } from '@mui/material'
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded'
import { AllocationBar } from '../ui-primitive/AllocationBar'
import { formatHours } from '../../lib/calendar'
import type { DisplayUnit } from '../../types/capacity'

type Props = { allocated: number; capacity: number; unit: DisplayUnit }

export function AllocationCell({ allocated, capacity, unit }: Props) {
  const over = allocated > capacity
  const status = over ? `${formatHours(allocated - capacity)}h over`
    : allocated === capacity ? capacity === 0 ? 'No capacity' : 'Fully allocated'
      : `${formatHours(capacity - allocated)}h available`
  const value = unit === 'hours' ? `${formatHours(allocated)}h`
    : capacity > 0 ? `${Math.round(allocated / capacity * 100)}%` : allocated > 0 ? 'No capacity' : '0%'
  return (
    <Box className="allocation-cell" sx={{ bgcolor: over ? '#fff3f4' : '#f4f9f7', px: 1.75, py: 1.25, borderRadius: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mb: 1 }}>
        <Typography component="span" sx={{ fontWeight: 700, fontSize: 15, color: over ? 'error.main' : 'text.primary' }}>{value}</Typography>
        <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>/ {formatHours(capacity)}h</Typography>
      </Box>
      <AllocationBar allocated={allocated} capacity={capacity} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75, color: over ? 'error.main' : 'text.secondary' }}>
        {over && <WarningAmberRounded sx={{ fontSize: 13 }} />}
        <Typography component="span" sx={{ fontSize: 11, fontWeight: over ? 600 : 400 }}>{status}</Typography>
      </Box>
    </Box>
  )
}