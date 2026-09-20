package main

import (
	"context"
	"encoding/json"
	"math"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestUpdatePersonRejectsInvalidRequests(t *testing.T) {
	tests := []struct {
		name string
		id   string
		body string
	}{
		{"invalid id", "abc", `{"weekly_hours":40}`},
		{"zero id", "0", `{"weekly_hours":40}`},
		{"id outside postgres integer", "2147483648", `{"weekly_hours":40}`},
		{"missing hours", "1", `{}`},
		{"null hours", "1", `{"weekly_hours":null}`},
		{"null body", "1", `null`},
		{"negative hours", "1", `{"weekly_hours":-1}`},
		{"excessive hours", "1", `{"weekly_hours":169}`},
		{"overflow hours", "1", `{"weekly_hours":1e999}`},
		{"string hours", "1", `{"weekly_hours":"40"}`},
		{"unknown field", "1", `{"weekly_hours":40,"name":"changed"}`},
		{"multiple values", "1", `{"weekly_hours":40}{"weekly_hours":20}`},
		{"trailing junk", "1", `{"weekly_hours":40}junk`},
		{"oversized body", "1", `{"weekly_hours":40}` + strings.Repeat(" ", 4096)},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPatch, "/api/people/"+test.id, strings.NewReader(test.body))
			request.SetPathValue("id", test.id)
			response := httptest.NewRecorder()
			(&server{}).handleUpdatePerson(response, request)
			if response.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400", response.Code)
			}
		})
	}
}

func TestParseCapacityRange(t *testing.T) {
	tests := []struct {
		name  string
		from  string
		to    string
		valid bool
	}{
		{"same day", "2026-01-06", "2026-01-06", true},
		{"year boundary", "2025-12-29", "2026-01-11", true},
		{"leap day", "2024-02-29", "2024-03-01", true},
		{"182 inclusive days", "2025-12-29", "2026-06-28", true},
		{"183 inclusive days", "2025-12-29", "2026-06-29", false},
		{"missing from", "", "2026-01-06", false},
		{"invalid date", "2026-02-30", "2026-03-01", false},
		{"invalid end", "2026-01-01", "bad", false},
		{"reversed", "2026-01-07", "2026-01-06", false},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			from, to, err := parseCapacityRange(test.from, test.to)
			if (err == nil) != test.valid {
				t.Fatalf("valid = %v, error = %v", test.valid, err)
			}
			if test.valid && (from.Format(time.DateOnly) != test.from || to.Format(time.DateOnly) != test.to) {
				t.Fatal("parsed dates changed")
			}
		})
	}
}

func TestCapacityAgainstSeededDatabase(t *testing.T) {
	dsn := os.Getenv("CAPACITY_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set CAPACITY_TEST_DATABASE_URL to run read-only database checks")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	db, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	var peopleCount int
	if err := db.QueryRow(ctx, `SELECT count(*) FROM people`).Scan(&peopleCount); err != nil {
		t.Fatal(err)
	}
	type assignment struct {
		personID   int
		start, end time.Time
		hours      float64
	}
	assignments := []assignment{}
	rows, err := db.Query(ctx, `SELECT person_id, start_date, end_date, hours_per_day FROM assignments WHERE person_id <= 5`)
	if err != nil {
		t.Fatal(err)
	}
	for rows.Next() {
		var item assignment
		if err := rows.Scan(&item.personID, &item.start, &item.end, &item.hours); err != nil {
			t.Fatal(err)
		}
		assignments = append(assignments, item)
	}
	if err := rows.Err(); err != nil {
		t.Fatal(err)
	}
	rows.Close()
	for _, test := range []struct {
		from, to string
		weeks    int
	}{
		{"2025-12-29", "2026-01-11", 2},
		{"2026-01-06", "2026-01-08", 1},
		{"2026-01-10", "2026-01-11", 1},
		{"2030-01-07", "2030-01-13", 1},
		{"2025-12-29", "2026-06-28", 26},
	} {
		t.Run(test.from+"_"+test.to, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, "/api/capacity?from="+test.from+"&to="+test.to, nil).WithContext(ctx)
			response := httptest.NewRecorder()
			(&server{db: db}).handleCapacity(response, request)
			if response.Code != http.StatusOK {
				t.Fatalf("status %d: %s", response.Code, response.Body.String())
			}
			var results []capacityResult
			if err := json.Unmarshal(response.Body.Bytes(), &results); err != nil {
				t.Fatal(err)
			}
			if len(results) != peopleCount*test.weeks {
				t.Fatalf("got %d rows, want %d", len(results), peopleCount*test.weeks)
			}
			for _, result := range results {
				from, to, err := parseCapacityRange(result.From, result.To)
				if err != nil {
					t.Fatal(err)
				}
				var allocated float64
				workdays := 0
				for day := from; !day.After(to); day = day.AddDate(0, 0, 1) {
					if day.Weekday() == time.Saturday || day.Weekday() == time.Sunday {
						continue
					}
					workdays++
					if result.PersonID <= 5 {
						for _, item := range assignments {
							if item.personID == result.PersonID && !day.Before(item.start) && !day.After(item.end) {
								allocated += item.hours
							}
						}
					}
				}
				if result.Workdays != workdays || math.Abs(result.CapacityHours-result.WeeklyHours*float64(workdays)/5) > 1e-8 {
					t.Fatalf("incorrect capacity for person %d in %s", result.PersonID, result.WeekStart)
				}
				if result.PersonID <= 5 && math.Abs(result.AllocatedHours-allocated) > 1e-8 {
					t.Fatalf("person %d in %s: allocated %g, want %g", result.PersonID, result.WeekStart, result.AllocatedHours, allocated)
				}
				if workdays == 0 && result.AllocatedHours != 0 {
					t.Fatal("weekend allocation must be zero")
				}
				if test.from == "2030-01-07" && result.AllocatedHours != 0 {
					t.Fatal("empty range allocation must be zero")
				}
			}
		})
	}
}
