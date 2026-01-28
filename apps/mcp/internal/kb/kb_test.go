package kb

import (
	"strings"
	"testing"
)

// --- Embedded docs load ---

func TestGetAPIDoc_AllExist(t *testing.T) {
	expected := []string{
		"jsandy-init", "procedure", "router", "middleware",
		"merge-routers", "create-client", "superjson", "defaults",
		"dynamic", "pubsub-adapter",
	}
	for _, name := range expected {
		content, ok := GetAPIDoc(name)
		if !ok {
			t.Errorf("GetAPIDoc(%q) not found", name)
			continue
		}
		if content == "" {
			t.Errorf("GetAPIDoc(%q) returned empty content", name)
		}
	}
}

func TestGetGuide_AllExist(t *testing.T) {
	expected := []string{
		"create-app", "procedures", "routers", "middleware",
		"client", "nextjs", "websocket", "pubsub-adapter", "zod-v4",
	}
	for _, name := range expected {
		content, ok := GetGuide(name)
		if !ok {
			t.Errorf("GetGuide(%q) not found", name)
			continue
		}
		if content == "" {
			t.Errorf("GetGuide(%q) returned empty content", name)
		}
	}
}

func TestGetPattern_AllExist(t *testing.T) {
	expected := []string{
		"auth", "crud", "error-handling", "pagination",
		"file-upload", "realtime-chat", "notifications",
	}
	for _, name := range expected {
		content, ok := GetPattern(name)
		if !ok {
			t.Errorf("GetPattern(%q) not found", name)
			continue
		}
		if content == "" {
			t.Errorf("GetPattern(%q) returned empty content", name)
		}
	}
}

func TestGetExports_AllExist(t *testing.T) {
	expected := []string{"main", "client", "adapters"}
	for _, name := range expected {
		content, ok := GetExports(name)
		if !ok {
			t.Errorf("GetExports(%q) not found", name)
			continue
		}
		if content == "" {
			t.Errorf("GetExports(%q) returned empty content", name)
		}
	}
}

func TestGetAPIDoc_NotFound(t *testing.T) {
	_, ok := GetAPIDoc("nonexistent")
	if ok {
		t.Error("expected GetAPIDoc(nonexistent) to return false")
	}
}

func TestGetGuide_NotFound(t *testing.T) {
	_, ok := GetGuide("nonexistent")
	if ok {
		t.Error("expected GetGuide(nonexistent) to return false")
	}
}

// --- List functions ---

func TestListAPIDocs(t *testing.T) {
	docs := ListAPIDocs()
	if len(docs) < 10 {
		t.Errorf("expected at least 10 API docs, got %d", len(docs))
	}
}

func TestListGuides(t *testing.T) {
	guides := ListGuides()
	if len(guides) < 8 {
		t.Errorf("expected at least 8 guides, got %d", len(guides))
	}
}

func TestListPatterns(t *testing.T) {
	patterns := ListPatterns()
	if len(patterns) < 7 {
		t.Errorf("expected at least 7 patterns, got %d", len(patterns))
	}
}

func TestListExports(t *testing.T) {
	exports := ListExports()
	if len(exports) < 3 {
		t.Errorf("expected at least 3 export docs, got %d", len(exports))
	}
}

// --- Lookup ---

func TestLookup_ExactMatch(t *testing.T) {
	entry, content, ok := Lookup("createClient")
	if !ok {
		t.Fatal("Lookup(createClient) not found")
	}
	if entry == nil {
		t.Fatal("entry is nil")
	}
	if entry.Name != "createClient" {
		t.Errorf("expected name 'createClient', got %q", entry.Name)
	}
	if content == "" {
		t.Error("expected non-empty content")
	}
}

func TestLookup_CaseInsensitive(t *testing.T) {
	_, _, ok1 := Lookup("createclient")
	_, _, ok2 := Lookup("CREATECLIENT")
	_, _, ok3 := Lookup("CreateClient")

	if !ok1 {
		t.Error("Lookup(createclient) should be case-insensitive")
	}
	if !ok2 {
		t.Error("Lookup(CREATECLIENT) should be case-insensitive")
	}
	if !ok3 {
		t.Error("Lookup(CreateClient) should be case-insensitive")
	}
}

func TestLookup_NotFound(t *testing.T) {
	entry, _, ok := Lookup("totallyFakeAPI")
	if ok {
		t.Error("expected Lookup(totallyFakeAPI) to return false")
	}
	if entry != nil {
		t.Error("expected nil entry for not-found")
	}
}

func TestLookup_AllIndexEntries(t *testing.T) {
	names := []string{
		"jsandy.init", "procedure", "router", "middleware",
		"mergeRouters", "createClient", "c.superjson", "defaults",
		"dynamic", "PubSubAdapter",
	}
	for _, name := range names {
		entry, _, ok := Lookup(name)
		if !ok {
			t.Errorf("Lookup(%q) not found", name)
			continue
		}
		if entry.Name != name {
			t.Errorf("Lookup(%q) returned entry with name %q", name, entry.Name)
		}
	}
}

// --- Search ---

func TestSearch_ReturnsResults(t *testing.T) {
	results := Search("websocket rooms", 5)
	if len(results) == 0 {
		t.Error("expected search results for 'websocket rooms'")
	}
}

func TestSearch_RespectsMaxResults(t *testing.T) {
	results := Search("procedure", 3)
	if len(results) > 3 {
		t.Errorf("expected at most 3 results, got %d", len(results))
	}
}

func TestSearch_NameMatchBoost(t *testing.T) {
	results := Search("createClient", 5)
	if len(results) == 0 {
		t.Fatal("expected results")
	}
	// The exact name match should be the top result
	if !strings.EqualFold(results[0].Name, "createClient") {
		t.Errorf("expected createClient as top result, got %q", results[0].Name)
	}
}

func TestSearch_NoResults(t *testing.T) {
	results := Search("xyznonexistent", 5)
	if len(results) != 0 {
		t.Errorf("expected 0 results for nonsense query, got %d", len(results))
	}
}

func TestSearch_EmptyQuery(t *testing.T) {
	results := Search("", 5)
	if len(results) != 0 {
		t.Errorf("expected 0 results for empty query, got %d", len(results))
	}
}

func TestSearch_ScoreDescending(t *testing.T) {
	results := Search("middleware context auth", 10)
	for i := 1; i < len(results); i++ {
		if results[i].Score > results[i-1].Score {
			t.Errorf("results not sorted by score: [%d].Score=%d > [%d].Score=%d",
				i, results[i].Score, i-1, results[i-1].Score)
		}
	}
}

func TestSearch_ResultFields(t *testing.T) {
	results := Search("procedure", 1)
	if len(results) == 0 {
		t.Fatal("expected results")
	}
	r := results[0]
	if r.Name == "" {
		t.Error("result Name is empty")
	}
	if r.Kind == "" {
		t.Error("result Kind is empty")
	}
	if r.Summary == "" {
		t.Error("result Summary is empty")
	}
	if r.Score <= 0 {
		t.Error("result Score should be positive")
	}
}
