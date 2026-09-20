import {
  Avatar,
  Box,
  Button,
  IconButton,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlined from "@mui/icons-material/EditOutlined";
import PeopleOutlineRounded from "@mui/icons-material/PeopleOutlineRounded";
import { AllocationCell } from "./AllocationCell";
import { formatDate, formatHours, weekCapacity } from "../../lib/calendar";
import type {
  CapacityRow,
  CapacityWeek,
  DisplayUnit,
  Person,
} from "../../types/capacity";

type Props = {
  weeks: CapacityWeek[];
  people: CapacityRow[];
  unit: DisplayUnit;
  loading: boolean;
  saving: boolean;
  onEdit: (person: Person) => void;
  onClearFilters: () => void;
};

const avatarColors = ["#f6dae7", "#d9ebe4", "#e8e3f1", "#f4e6c9", "#deebf2"];

export function CapacityGrid({
  weeks,
  people,
  unit,
  loading,
  saving,
  onEdit,
  onClearFilters,
}: Props) {
  return (
    <>
      <Box
        component="section"
        aria-label="Team capacity by person"
        sx={{ display: { xs: "block", md: "none" }, minWidth: 0 }}
      >
        {loading ? (
          <Box role="status" aria-label="Loading team capacity">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton
                key={index}
                variant="rounded"
                height={220}
                sx={{ mb: 2 }}
              />
            ))}
          </Box>
        ) : (
          <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
            {people.map((person) => {
              const total = person.allocations.reduce(
                (sum, value) => sum + value,
                0,
              );
              const capacity = weeks.reduce(
                (sum, week) =>
                  sum + weekCapacity(person.weeklyHours, week.workdays),
                0,
              );
              return (
                <Box
                  component="li"
                  key={person.id}
                  sx={{
                    py: 3,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    "&:first-of-type": { pt: 2 },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        fontSize: 12,
                        fontWeight: 700,
                        bgcolor:
                          avatarColors[(person.id - 1) % avatarColors.length],
                        color: "#4d4453",
                      }}
                    >
                      {person.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </Avatar>
                    <Box
                      sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
                    >
                      <Typography
                        component="h2"
                        sx={{ fontSize: 15, fontWeight: 700 }}
                      >
                        {person.name}
                      </Typography>
                      <Typography
                        sx={{ fontSize: 12, color: "text.secondary" }}
                      >
                        {formatHours(person.weeklyHours)}h / week
                      </Typography>
                    </Box>
                    <Tooltip title={`Edit ${person.name}'s capacity`}>
                      <span>
                        <IconButton
                          aria-label={`Edit ${person.name}'s capacity`}
                          disabled={saving}
                          onClick={() => onEdit(person)}
                          sx={{ width: 44, height: 44 }}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                  <Box component="dl" sx={{ m: 0, display: "grid", gap: 1.5 }}>
                    {weeks.map((week, index) => (
                      <Box key={week.start}>
                        <Box component="dt" sx={{ mb: 0.75 }}>
                          <Typography
                            component="span"
                            sx={{
                              display: "block",
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            {formatDate(week.from, true)} -{" "}
                            {formatDate(week.to, true)}
                          </Typography>
                          <Typography
                            component="span"
                            sx={{ fontSize: 11, color: "text.secondary" }}
                          >
                            {week.workdays} workdays
                          </Typography>
                        </Box>
                        <Box component="dd" sx={{ m: 0 }}>
                          <AllocationCell
                            allocated={person.allocations[index]}
                            capacity={weekCapacity(
                              person.weeklyHours,
                              week.workdays,
                            )}
                            unit={unit}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      gap: 1,
                      mt: 1.5,
                    }}
                  >
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      Selected range total
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: total > capacity ? "error.main" : "text.primary",
                      }}
                    >
                      {formatHours(total)}h / {formatHours(capacity)}h
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
        {!loading && people.length === 0 && (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <PeopleOutlineRounded sx={{ color: "text.secondary", mb: 1 }} />
            <Typography>No matching team members</Typography>
            <Button onClick={onClearFilters} sx={{ mt: 1 }}>
              Clear filters
            </Button>
          </Box>
        )}
      </Box>
      <TableContainer
        className="capacity-table-scroll"
        tabIndex={0}
        aria-label="Team capacity grid"
        sx={{
          display: { xs: "none", md: "block" },
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderBottom: "1px solid",
          borderColor: "divider",
          maxHeight: 680,
        }}
      >
        <Table
          stickyHeader
          aria-label="Weekly team capacity"
          sx={{
            minWidth: {
              xs: 270 + weeks.length * 170,
              sm: 390 + weeks.length * 220,
            },
            tableLayout: "fixed",
          }}
        >
          <caption className="visually-hidden">
            Allocated hours against available capacity per person and week.
            Boundary weeks include only selected weekdays.
          </caption>
          <TableHead>
            <TableRow>
              <TableCell
                className="person-column"
                sx={{
                  width: { xs: 150, sm: 240 },
                  zIndex: 4,
                  bgcolor: "#fcfbfd",
                }}
              >
                <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                  TEAM MEMBER
                </Typography>
                <Typography
                  sx={{ fontSize: 11, color: "text.secondary", mt: 0.5 }}
                >
                  Weekly capacity
                </Typography>
              </TableCell>
              {weeks.map((week) => (
                <TableCell
                  key={week.start}
                  align="center"
                  sx={{
                    width: { xs: 170, sm: 220 },
                    bgcolor: "#fcfbfd",
                    py: 2,
                  }}
                >
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                    {formatDate(week.from)} - {formatDate(week.to)}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 11, color: "text.secondary", mt: 0.5 }}
                  >
                    {week.from.slice(0, 4)}
                    {week.to.slice(0, 4) !== week.from.slice(0, 4)
                      ? ` / ${week.to.slice(0, 4)}`
                      : ""}{" "}
                    · {week.workdays} workdays
                  </Typography>
                </TableCell>
              ))}
              <TableCell
                align="right"
                sx={{ width: { xs: 120, sm: 150 }, bgcolor: "#fcfbfd" }}
              >
                <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
                  TOTAL
                </Typography>
                <Typography
                  sx={{ fontSize: 11, color: "text.secondary", mt: 0.5 }}
                >
                  Selected range
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading
              ? Array.from({ length: 8 }, (_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={weeks.length + 2}>
                      <Skeleton height={62} />
                    </TableCell>
                  </TableRow>
                ))
              : people.map((person) => {
                  const total = person.allocations.reduce(
                    (sum, value) => sum + value,
                    0,
                  );
                  const capacity = weeks.reduce(
                    (sum, week) =>
                      sum + weekCapacity(person.weeklyHours, week.workdays),
                    0,
                  );
                  return (
                    <TableRow key={person.id}>
                      <TableCell
                        component="th"
                        scope="row"
                        className="person-column"
                        sx={{ bgcolor: "background.paper", zIndex: 1 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: { xs: 1, sm: 1.5 },
                          }}
                        >
                          <Avatar
                            sx={{
                              display: { xs: "none", sm: "flex" },
                              width: 34,
                              height: 34,
                              fontSize: 12,
                              fontWeight: 700,
                              bgcolor:
                                avatarColors[
                                  (person.id - 1) % avatarColors.length
                                ],
                              color: "#4d4453",
                            }}
                          >
                            {person.name
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                              {person.name}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <Typography
                                sx={{ fontSize: 12, color: "text.secondary" }}
                              >
                                {formatHours(person.weeklyHours)}h / week
                              </Typography>
                              <Tooltip title={`Edit ${person.name}'s capacity`}>
                                <span>
                                  <IconButton
                                    size="small"
                                    aria-label={`Edit ${person.name}'s capacity`}
                                    disabled={saving}
                                    onClick={() => onEdit(person)}
                                  >
                                    <EditOutlined sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Box>
                      </TableCell>
                      {weeks.map((week, index) => (
                        <TableCell key={week.start} sx={{ p: 1.25 }}>
                          <AllocationCell
                            allocated={person.allocations[index]}
                            capacity={weekCapacity(
                              person.weeklyHours,
                              week.workdays,
                            )}
                            unit={unit}
                          />
                        </TableCell>
                      ))}
                      <TableCell align="right">
                        <Typography
                          sx={{
                            fontSize: 15,
                            fontWeight: 700,
                            color:
                              total > capacity ? "error.main" : "text.primary",
                          }}
                        >
                          {formatHours(total)}h
                        </Typography>
                        <Typography
                          sx={{ fontSize: 11, color: "text.secondary" }}
                        >
                          of {formatHours(capacity)}h
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
            {!loading && people.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={weeks.length + 2}
                  align="center"
                  sx={{ py: 8 }}
                >
                  <PeopleOutlineRounded
                    sx={{ color: "text.secondary", mb: 1 }}
                  />
                  <Typography>No matching team members</Typography>
                  <Button onClick={onClearFilters} sx={{ mt: 1 }}>
                    Clear filters
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
