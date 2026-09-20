import {
  Box,
  FormControlLabel,
  InputAdornment,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import SearchRounded from "@mui/icons-material/SearchRounded";
import type { DisplayUnit } from "../../types/capacity";

type Props = {
  search: string;
  overOnly: boolean;
  unit: DisplayUnit;
  onSearch: (value: string) => void;
  onOverOnly: (value: boolean) => void;
  onUnit: (value: DisplayUnit) => void;
};

export function CapacityFilters({
  search,
  overOnly,
  unit,
  onSearch,
  onOverOnly,
  onUnit,
}: Props) {
  return (
    <Box className="filter-controls">
      <TextField
        label="Find a person"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ width: { xs: "100%", sm: 240 } }}
      />
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={overOnly}
            onChange={(event) => onOverOnly(event.target.checked)}
          />
        }
        label="Overallocated only"
        sx={{ "& .MuiFormControlLabel-label": { fontSize: 13 } }}
      />
      <ToggleButtonGroup
        size="small"
        value={unit}
        exclusive
        onChange={(_event, value: DisplayUnit | null) => value && onUnit(value)}
        aria-label="Allocation display"
        sx={{ ml: { sm: "auto" } }}
      >
        <ToggleButton value="hours" aria-label="Show hours">
          Hours
        </ToggleButton>
        <ToggleButton value="percent" aria-label="Show percentages">
          %
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
