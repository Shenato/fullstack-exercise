.PHONY: up down reset logs psql

up:      ## Start everything (web on :3000, api on :8080)
	docker compose up --build

down:    ## Stop everything
	docker compose down

reset:   ## Wipe the database and re-seed
	docker compose down -v && docker compose up --build

logs:    ## Tail api logs
	docker compose logs -f api

psql:    ## Open a psql shell against the seeded database
	docker compose exec db psql -U capacity -d capacity
