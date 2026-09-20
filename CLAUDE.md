# Capacity

Team capacity view: who is allocated how much, week by week, and who is over-committed.
Go API + Postgres, React frontend, all wired through Docker Compose.

## Quick Reference

- **Go 1.26**, PostgreSQL 17, stdlib `net/http` (`ServeMux` pattern routing), pgx/v5
- **React 19**, TypeScript, Vite
- Everything runs in Compose. There is no local toolchain to install.

## Key Commands

```bash
make up       # Start everything — web on :3000, api on :8080
make down     # Stop everything
make reset    # Wipe the database and re-seed (destructive)
make logs     # Tail api logs
make psql     # psql shell against the seeded database
```

## What You Are Building

Three things, all marked `TODO`:

| Where                      | What                                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `api/capacity.go`          | `GET /api/capacity?from=&to=` — allocated hours and capacity, per person, per week                                                        |
| `web/src/CapacityGrid.tsx` | The grid that renders it, with over-allocation obvious at a glance, backward/forward week navigation and date-range selection from the UI |
| `api/people.go`            | `PATCH /api/people/{id}` — update a person's weekly hours; the grid must stay correct after                                               |

The JSON shape between them is undefined on purpose; both ends are yours to design
together. This capacity view will be one component of a team overview page, alongside
a timeline of the team's logged time. For this assignment, build only the capacity view.

## Critical Rules

- **NEVER edit `DECISIONS.md`** — that file is written by the human working with you, not by you. Leave it alone even if asked to tidy the repo.
- **NEVER edit `db/schema.sql` or `db/seed.sql`** — the data is fixed input. Read it, work with what is there.
- **NEVER change `docker-compose.yml`, the `Dockerfile`s, or the `Makefile`** — the run environment is fixed, and submissions that alter it cannot be built.
- Commit as you go on a feature branch. Don't squash at the end — the history is worth keeping.

## Working Notes

Keep `.notes/worklog.md` current as you work. It is the running record a teammate would
need to pick this up tomorrow — append to it, don't rewrite it.

Worth writing down:

- A decision you made where the spec didn't say which way to go, and why you went that way
- An assumption you had to make about the data or the domain
- Something you tried that didn't work
- Something you knowingly left unfinished

Not worth writing down: a play-by-play of every edit, or a summary of code that already
reads clearly. Keep it short — a line or two per entry.

## Layout

- `api/` — Go service. `main.go` wires the server; `capacity.go` and `people.go` are the endpoints.
- `web/` — Vite + React app. `App.tsx` sets the range; `CapacityGrid.tsx` renders it.
- `db/` — `schema.sql` and `seed.sql`, loaded automatically on first `make up`.
- `.notes/` — your working notes.

## Conventions

- Go: return errors, don't panic. Use `writeJSON` for responses.
- SQL belongs in the query, not assembled from strings in Go.
- TypeScript everywhere in `web/`, `strict` is on.

## Before You Call It Done

Start it, open it, and read what it actually produces. Building without looking is the
most common way this task goes wrong.

## Further Reading

- [README.md](README.md) — the brief, and what we look at when we read this
