import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import type { Person } from "../types/capacity";

type Props = {
  person: Person;
  pending: boolean;
  onClose: () => void;
  onSave: (person: Person) => Promise<void>;
};

export function WeeklyHoursEditor({ person, pending, onClose, onSave }: Props) {
  const [hours, setHours] = useState(String(person.weeklyHours));
  const [error, setError] = useState("");
  const value = Number(hours);
  const valid =
    hours.trim() !== "" && Number.isFinite(value) && value >= 0 && value <= 168;
  return (
    <Dialog
      open
      onClose={pending ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="hours-editor-title"
    >
      <Box
        component="form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!valid || pending) return;
          setError("");
          try {
            await onSave({ ...person, weeklyHours: value });
          } catch (failure) {
            setError(
              failure instanceof Error
                ? failure.message
                : "Could not save capacity.",
            );
          }
        }}
      >
        <DialogTitle id="hours-editor-title">Weekly capacity</DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Typography sx={{ mb: 2, color: "text.secondary" }}>
            {person.name}
          </Typography>
          <TextField
            fullWidth
            autoFocus
            type="number"
            label="Hours per week"
            value={hours}
            disabled={pending}
            onChange={(event) => setHours(event.target.value)}
            error={!valid}
            helperText={
              !valid ? "Enter a number between 0 and 168." : undefined
            }
            slotProps={{ htmlInput: { min: 0, max: 168, step: 0.01 } }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!valid || pending}
          >
            {pending ? "Saving..." : "Save capacity"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
