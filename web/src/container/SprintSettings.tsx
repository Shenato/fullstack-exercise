import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import type { SprintSettings as Settings } from "../types/capacity";
import { validSettings } from "../lib/calendar";

type Props = {
  settings: Settings;
  onClose: () => void;
  onSave: (settings: Settings) => void;
};

export function SprintSettings({ settings, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(settings);
  const valid = validSettings(draft);
  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="sprint-settings-title"
    >
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onSave(draft);
        }}
      >
        <DialogTitle id="sprint-settings-title">Sprint settings</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 3, pt: "12px !important" }}>
          <TextField
            autoFocus
            select
            label="Sprint length"
            value={draft.weeks}
            onChange={(event) =>
              setDraft({ ...draft, weeks: Number(event.target.value) })
            }
          >
            {Array.from({ length: 8 }, (_, index) => index + 1).map((weeks) => (
              <MenuItem key={weeks} value={weeks}>
                {weeks} {weeks === 1 ? "week" : "weeks"}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            label="Sprint anchor (Monday)"
            value={draft.anchor}
            onChange={(event) =>
              setDraft({ ...draft, anchor: event.target.value })
            }
            slotProps={{ inputLabel: { shrink: true } }}
            error={!valid}
          />
          {!valid && (
            <Alert severity="error">
              Choose a valid Monday and a length of 1 to 8 weeks.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!valid}>
            Save settings
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
