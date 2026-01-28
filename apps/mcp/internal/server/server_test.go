package server

import (
	"testing"
)

func TestNewMCPServer_Creates(t *testing.T) {
	s := NewMCPServer()
	if s == nil {
		t.Fatal("NewMCPServer() returned nil")
	}
}

func TestNewHandler_Creates(t *testing.T) {
	h := NewHandler()
	if h == nil {
		t.Fatal("NewHandler() returned nil")
	}
}

func TestServerConstants(t *testing.T) {
	if ServerName == "" {
		t.Error("ServerName is empty")
	}
	if ServerVersion == "" {
		t.Error("ServerVersion is empty")
	}
	if RPCVersion == "" {
		t.Error("RPCVersion is empty")
	}
}

func TestServerInstructions(t *testing.T) {
	instructions := serverInstructions()
	if instructions == "" {
		t.Error("server instructions are empty")
	}
	if len(instructions) < 50 {
		t.Error("server instructions seem too short")
	}
}
