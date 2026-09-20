# Worklog

Running notes on how this got built — decisions, assumptions, dead ends, and anything
left unfinished. Append as you go; a line or two per entry is right.

---

- At the user's request, reset the inherited Git history and publish the current
  files to the new public Shenato/fullstack-exercise repository as `init assignment`.

- The first frontend stage uses Material UI and a deterministic in-memory adapter;
  no capacity API calls yet. Presentational components are separate from stateful containers and the page.
- Sprint length defaults to two weeks; length and a Monday anchor are stored in
  localStorage. Custom ranges prorate boundary-week capacity by selected weekdays.
- Capacity edits use TanStack Query optimistic updates, rollback, and invalidation.
  Mock edits survive navigation/refresh but reset on reload; sprint settings persist.
- Verified the production build, desktop/mobile layouts, saved sprint settings,
  clipped weeks, zero capacity, edit refresh and simulated failure rollback.
- Below 900px, capacity uses a person-by-person list with full-width week entries
  instead of a sideways-scrolling table. Verified 320/390/768px layouts, mobile editing, filtering and eight-week sprints; desktop retains the table.
- Day.js handles strict date parsing, UTC arithmetic and ISO week boundaries;
  sprint anchoring and prorated weekday capacity remain application rules.
- The frontend now reads real capacity rows through an HTTP adapter and PATCHes
  weekly hours. TanStack Query awaits capacity-prefix invalidation after saves;
  active ranges refetch and inactive ranges become stale, even with polling off.
- Verified the real 500-person view and PATCH-to-GET sequence. A simulated failed
  PATCH rolled back the optimistic hours and refetched without changing database values.
- Final review aligned PATCH validation with the editor's 0-168 hour range,
  limited bodies to 4 KiB and one JSON object, and bounded database calls to five seconds.
- Initial read failures now show unavailable totals instead of empty results.
  Prorated capacity retains fractional precision for comparisons; only display values round to two decimals.
- Added 23 API validation cases and five read-only seeded-database scenarios,
  including independent allocation calculations for the first five people; all passed.
  Production build and desktop/mobile save, refetch, failure/retry checks also passed.
- Updates remain last-write-wins (no version field in the fixed schema). Existing
  query timings are single-request measurements, not evidence of high-concurrency capacity.
