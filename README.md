# Capacity view

Managers need to see who is over-committed before the week starts, not after. This is a
small slice of that: allocation against capacity, per person, per week.

This capacity view will be one component of a team overview page, alongside a timeline
of the team's logged time. For this assignment, build only the capacity view.

Budget about ninety minutes. The scaffold runs already — `make up` gives you a working
database, a working API, and a working dev server. Three things are stubbed out and yours
to build.
You do not need Go, Node.js, or Postgres installed locally.

## Requirements

- Docker with Docker Compose v2
- Make
- Ports 3000 and 8080 available

## Running it

From the repository root:

```bash
make up
```

Web on http://localhost:3000, API on http://localhost:8080.
`GET /api/health` works today and tells you the database is seeded.

`make up` stays in the foreground. Leave it running while you work and press `Ctrl-C` to
stop it. Frontend changes reload automatically. After a backend change, stop and run
`make up` again so the API is rebuilt.

Useful commands:

```bash
make down   # stop and remove the containers
make reset  # wipe the database and re-seed it
make logs   # follow API logs
make psql   # open a Postgres shell
```

## What to build

1. **`GET /api/capacity?from=&to=`** in `api/capacity.go` — for every person and every
   week in the range, how many hours they're allocated and how much capacity they have.
2. **`CapacityGrid`** in `web/src/CapacityGrid.tsx` — people down the side, weeks across
   the top, over-allocation obvious at a glance. Users should be able to navigate
   backward and forward by week and choose a date range from the UI.
3. **Editing capacity** — a manager can change someone's weekly hours from the grid.
   `PATCH /api/people/{id}` is stubbed in `api/people.go`. After saving, the numbers
   on screen must be correct without a full page reload — how they get there (refetch
   the range, patch what you already have, something optimistic) is a decision we'll
   ask about, so write it down.

The JSON shape between them is undefined on purpose. It's your API; design it.

## The data

`db/schema.sql` and `db/seed.sql` hold the team and their assignments. Read them.
They're fixed input — don't edit them.

## Ground rules

- **Use AI tools.** We do, all day. This task assumes it.
- **Use whatever dependencies help.** The API already includes `sqlx`, which we use in
  Focus API, but using it is optional.
- **Don't touch the run environment** — Compose files, Dockerfiles, the Makefile, the
  schema, or the seed. We rebuild submissions with our own copies of those, so changes
  there are lost anyway.
- **Commit as you go** on a feature branch, and don't squash. The history is useful to us.

## When you're done

**Start it, open it, and look at the numbers.** Do they say what you expect? If something
looks off, either fix it or write down in `DECISIONS.md` that you saw it and why you left
it. Both are fine answers. Not looking is the one thing that isn't.

Then fill in `DECISIONS.md` — it's short, and it's the first thing we read.

## How we read this

We spend about ten minutes per submission, on:

- `DECISIONS.md`, in your words
- `.notes/worklog.md`, including decisions or verification that did not make the final summary
- The running grid, and whether the numbers hold up
- The API and query design, and how the view behaves after an edit
- The diff, as a piece of code someone else has to maintain
- Your commit history

Then we talk about it for an hour, live, and extend it together. Come ready to explain
what you decided and why — that conversation is the real point of this exercise, and it's
much easier when the notes are honest about what you didn't get to.
