package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"
)

type updatePersonRequest struct {
	WeeklyHours *float64 `json:"weekly_hours"`
}

// handleUpdatePerson serves PATCH /api/people/{id}
//
// It should update the person's weekly hours. What it returns is yours to
// design — the grid is the consumer, and it has state to keep honest.
func (s *server) handleUpdatePerson(w http.ResponseWriter, r *http.Request) {
	personID, err := strconv.ParseInt(r.PathValue("id"), 10, 32)
	if err != nil || personID <= 0 {
		http.Error(w, "invalid person ID", http.StatusBadRequest)
		return
	}

	var body updatePersonRequest
	r.Body = http.MaxBytesReader(w, r.Body, 4096)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&body); err != nil {
		http.Error(w, "invalid JSON body", http.StatusBadRequest)
		return
	}

	if err := decoder.Decode(new(any)); err != io.EOF {
		http.Error(w, "body must contain exactly one JSON object", http.StatusBadRequest)
		return
	}

	if body.WeeklyHours == nil || *body.WeeklyHours < 0 || *body.WeeklyHours > 168 {
		http.Error(w, "weekly_hours must be between 0 and 168", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	result, err := s.db.Exec(
		ctx,
		`UPDATE people SET weekly_hours = $1 WHERE id = $2`,
		*body.WeeklyHours,
		personID,
	)
	if err != nil {
		log.Printf("update person %d: %v", personID, err)
		http.Error(w, "could not update person", http.StatusInternalServerError)
		return
	}

	if result.RowsAffected() == 0 {
		http.Error(w, "person not found", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"id":           personID,
		"weekly_hours": *body.WeeklyHours,
	})
}
