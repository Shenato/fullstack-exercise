import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Collapse,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import { CapacityFilters } from "../components/ui/CapacityFilters";
import { RefreshControls } from "../components/ui/RefreshControls";
import { formatDate, rangeError } from "../lib/calendar";
import type { DateRange, DisplayUnit } from "../types/capacity";

type Props = {
  range: DateRange;
  sprintWeeks: number;
  custom: boolean;
  search: string;
  overOnly: boolean;
  unit: DisplayUnit;
  automatic: boolean;
  seconds: number;
  busy: boolean;
  disabled: boolean;
  onRange: (range: DateRange) => void;
  onNavigate: (direction: number) => void;
  onCurrent: () => void;
  onSearch: (value: string) => void;
  onOverOnly: (value: boolean) => void;
  onUnit: (value: DisplayUnit) => void;
  onAutomatic: (value: boolean) => void;
  onSeconds: (value: number) => void;
  onRefresh: () => void;
};

export function CapacityControls(props: Props) {
  const [editingDates, setEditingDates] = useState(false);
  const [draft, setDraft] = useState(props.range);
  const error = rangeError(draft);
  return (
    <Box
      component="section"
      aria-label="Capacity controls"
      className="controls-section"
    >
      <Box className="range-toolbar">
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="Previous sprint">
            <span>
              <IconButton
                aria-label="Previous sprint"
                disabled={props.disabled}
                onClick={() => props.onNavigate(-1)}
              >
                <ChevronLeftRounded />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Next sprint">
            <span>
              <IconButton
                aria-label="Next sprint"
                disabled={props.disabled}
                onClick={() => props.onNavigate(1)}
              >
                <ChevronRightRounded />
              </IconButton>
            </span>
          </Tooltip>
          <Box sx={{ ml: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
              {formatDate(props.range.from)} -{" "}
              {formatDate(props.range.to, true)}
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              {props.custom
                ? "Custom range"
                : `${props.sprintWeeks}-week sprint`}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            disabled={props.disabled}
            onClick={props.onCurrent}
          >
            Current sprint
          </Button>
          <Button
            size="small"
            startIcon={<CalendarMonthOutlined />}
            disabled={props.disabled}
            aria-expanded={editingDates}
            aria-controls="custom-date-range"
            onClick={() => setEditingDates(!editingDates)}
          >
            Date range
          </Button>
        </Box>
        <Box sx={{ ml: { lg: "auto" } }}>
          <RefreshControls
            automatic={props.automatic}
            seconds={props.seconds}
            busy={props.busy || props.disabled}
            onAutomatic={props.onAutomatic}
            onSeconds={props.onSeconds}
            onRefresh={props.onRefresh}
          />
        </Box>
      </Box>
      <Collapse in={editingDates}>
        <Box
          component="form"
          id="custom-date-range"
          onSubmit={(event) => {
            event.preventDefault();
            if (!error) {
              props.onRange(draft);
              setEditingDates(false);
            }
          }}
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "start",
            pt: 2,
          }}
        >
          <TextField
            type="date"
            label="From"
            value={draft.from}
            disabled={props.disabled}
            onChange={(event) =>
              setDraft({ ...draft, from: event.target.value })
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            label="To"
            value={draft.to}
            disabled={props.disabled}
            onChange={(event) => setDraft({ ...draft, to: event.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!!error || props.disabled}
          >
            Apply range
          </Button>
          {error && (
            <Alert severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
          )}
        </Box>
      </Collapse>
      <CapacityFilters
        search={props.search}
        overOnly={props.overOnly}
        unit={props.unit}
        onSearch={props.onSearch}
        onOverOnly={props.onOverOnly}
        onUnit={props.onUnit}
      />
    </Box>
  );
}
