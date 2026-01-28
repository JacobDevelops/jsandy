//go:build js && wasm

package main

import (
	"net/http"

	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/server"
	"github.com/syumai/workers"
)

func main() {
	handler := server.NewHandler()

	mux := http.NewServeMux()
	mux.Handle("/mcp", handler)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	workers.Serve(mux)
}
