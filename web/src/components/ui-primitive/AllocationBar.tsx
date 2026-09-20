import { Box } from '@mui/material'

type Props = { allocated: number; capacity: number }

export function AllocationBar({ allocated, capacity }: Props) {
  const over = allocated > capacity
  const percentage = capacity > 0 ? Math.min(allocated / capacity * 100, 100) : allocated > 0 ? 100 : 0
  return (
    <Box aria-hidden="true" sx={{ height: 5, borderRadius: 1, bgcolor: over ? '#f2d7db' : '#e2ede9', overflow: 'hidden' }}>
      <Box sx={{ width: `${percentage}%`, height: '100%', bgcolor: over ? 'error.main' : allocated === capacity && capacity > 0 ? '#90723c' : 'success.main', transition: 'width 180ms ease' }} />
    </Box>
  )
}