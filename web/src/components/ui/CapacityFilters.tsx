import { useCallback, useEffect, useRef, useState } from "react";
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

const DEBOUNCE_DELAY = 200; // human perception doesn't notice delays at this delay but we still reduce unnecessary calls

function useDebounce(callback: (value: string) => void) {
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => () => clearTimeout(timeout.current), []);

  return useCallback((value: string) => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(
      () => callbackRef.current(value),
      DEBOUNCE_DELAY,
    );
  }, []);
}

export function CapacityFilters({
  search,
  overOnly,
  unit,
  onSearch,
  onOverOnly,
  onUnit,
}: Props) {
  const [searchValue, setSearchValue] = useState(search);
  const debouncedSearch = useDebounce(onSearch);

  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  return (
    <Box className="filter-controls">
      <TextField
        label="Find a person"
        value={searchValue}
        onChange={(event) => {
          setSearchValue(event.target.value);
          debouncedSearch(event.target.value);
        }}
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
