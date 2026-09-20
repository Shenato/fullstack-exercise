package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"time"
)

type capacityResult struct {
	PersonID       int     `json:"personId"`
	Name           string  `json:"name"`
	WeeklyHours    float64 `json:"weeklyHours"`
	WeekStart      string  `json:"weekStart"`
	From           string  `json:"from"`
	To             string  `json:"to"`
	Workdays       int     `json:"workdays"`
	AllocatedHours float64 `json:"allocatedHours"`
	CapacityHours  float64 `json:"capacityHours"`
}

// handleCapacity serves GET /api/capacity?from=YYYY-MM-DD&to=YYYY-MM-DD
//
// It should return, for every person and every week in the requested range,
// how many hours they are allocated and how much capacity they have.
//
// The response shape is yours to design — the grid in web/ is the consumer.
func (s *server) handleCapacity(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	from, to, err := parseCapacityRange(query.Get("from"), query.Get("to"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, err := s.db.Query(ctx, capacityQuery, from, to)
	if err != nil {
		log.Printf("query capacity: %v", err)
		http.Error(w, "could not load capacity", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	results := make([]capacityResult, 0)
	for rows.Next() {
		var result capacityResult
		var weekStart, rangeFrom, rangeTo time.Time

		err := rows.Scan(
			&result.PersonID, &result.Name, &result.WeeklyHours,
			&weekStart, &rangeFrom, &rangeTo, &result.Workdays,
			&result.AllocatedHours, &result.CapacityHours,
		)
		if err != nil {
			log.Printf("scan capacity: %v", err)
			http.Error(w, "could not read capacity", http.StatusInternalServerError)
			return
		}

		result.WeekStart = weekStart.Format(time.DateOnly)
		result.From = rangeFrom.Format(time.DateOnly)
		result.To = rangeTo.Format(time.DateOnly)
		results = append(results, result)
	}

	if err := rows.Err(); err != nil {
		log.Printf("iterate capacity: %v", err)
		http.Error(w, "could not load capacity", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, results)
}

func parseCapacityRange(fromValue, toValue string) (time.Time, time.Time, error) {
	from, err := time.Parse(time.DateOnly, fromValue)
	if err != nil {
		return time.Time{}, time.Time{}, errors.New("from must be YYYY-MM-DD")
	}

	to, err := time.Parse(time.DateOnly, toValue)
	if err != nil {
		return time.Time{}, time.Time{}, errors.New("to must be YYYY-MM-DD")
	}

	if to.Before(from) {
		return time.Time{}, time.Time{}, errors.New("to must be on or after from")
	}

	const maxRangeDays = 182
	if to.Sub(from) >= maxRangeDays*24*time.Hour {
		return time.Time{}, time.Time{}, errors.New("range must not exceed 182 days")
	}

	return from, to, nil
}

const capacityQuery = `
WITH params AS (
    SELECT $1::date AS from_date,
           $2::date AS to_date
),
days AS (
    SELECT from_date + day_offset AS day
    FROM params
    CROSS JOIN LATERAL
        generate_series(0, to_date - from_date) AS series(day_offset)
),
weeks AS (
    SELECT date_trunc('week', day)::date AS week_start,
           min(day) AS from_date,
           max(day) AS to_date,
           count(*) FILTER (
               WHERE extract(isodow FROM day) <= 5
           ) AS workdays
    FROM days
    GROUP BY 1
),
allocated AS (
    SELECT assignments.person_id,
           date_trunc('week', days.day)::date AS week_start,
           sum(assignments.hours_per_day) AS allocated_hours
    FROM days
    JOIN assignments
      ON assignments.start_date <= days.day
     AND assignments.end_date >= days.day
    WHERE extract(isodow FROM days.day) <= 5
    GROUP BY assignments.person_id, 2
)
SELECT people.id,
       people.name,
       people.weekly_hours,
       weeks.week_start,
       weeks.from_date,
       weeks.to_date,
       weeks.workdays,
       coalesce(allocated.allocated_hours, 0) AS allocated_hours,
       people.weekly_hours * weeks.workdays / 5.0 AS capacity_hours
FROM people
CROSS JOIN weeks
LEFT JOIN allocated
  ON allocated.person_id = people.id
 AND allocated.week_start = weeks.week_start
ORDER BY people.id, weeks.week_start;`
