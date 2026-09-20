import { Box, FormControlLabel, IconButton, MenuItem, Switch, TextField, Tooltip } from '@mui/material'
import RefreshRounded from '@mui/icons-material/RefreshRounded'

type Props = {
  automatic: boolean
  seconds: number
  busy: boolean
  onAutomatic: (value: boolean) => void
  onSeconds: (value: number) => void
  onRefresh: () => void
}

export function RefreshControls({ automatic, seconds, busy, onAutomatic, onSeconds, onRefresh }: Props) {
  return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
    <FormControlLabel control={<Switch size="small" checked={automatic} onChange={event => onAutomatic(event.target.checked)} />} label="Auto-refresh" sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: 12 } }} />
    <TextField select label="Interval" value={seconds} disabled={!automatic} onChange={event => onSeconds(Number(event.target.value))} sx={{ minWidth: 88 }}><MenuItem value={30}>30 sec</MenuItem><MenuItem value={60}>60 sec</MenuItem></TextField>
    <Tooltip title="Refresh capacity"><span><IconButton aria-label="Refresh capacity" disabled={busy} onClick={onRefresh}><RefreshRounded className={busy ? 'refreshing' : undefined} /></IconButton></span></Tooltip>
  </Box>
}