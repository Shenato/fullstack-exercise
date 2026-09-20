package main

import "net/http"

// handleCapacity serves GET /api/capacity?from=YYYY-MM-DD&to=YYYY-MM-DD
//
// It should return, for every person and every week in the requested range,
// how many hours they are allocated and how much capacity they have.
//
// The response shape is yours to design — the grid in web/ is the consumer.
//
// TODO: implement.
func (s *server) handleCapacity(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}
