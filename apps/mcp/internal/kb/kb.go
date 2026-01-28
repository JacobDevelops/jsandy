package kb

import "embed"

//go:embed docs/api/*.md
var apiDocs embed.FS

//go:embed docs/guides/*.md
var guideDocs embed.FS

//go:embed docs/patterns/*.md
var patternDocs embed.FS

//go:embed docs/exports/*.md
var exportDocs embed.FS

// GetAPIDoc returns the content of an API reference document.
func GetAPIDoc(name string) (string, bool) {
	data, err := apiDocs.ReadFile("docs/api/" + name + ".md")
	if err != nil {
		return "", false
	}
	return string(data), true
}

// GetGuide returns the content of a guide document.
func GetGuide(name string) (string, bool) {
	data, err := guideDocs.ReadFile("docs/guides/" + name + ".md")
	if err != nil {
		return "", false
	}
	return string(data), true
}

// GetPattern returns the content of a pattern document.
func GetPattern(name string) (string, bool) {
	data, err := patternDocs.ReadFile("docs/patterns/" + name + ".md")
	if err != nil {
		return "", false
	}
	return string(data), true
}

// GetExports returns the content of an exports listing.
func GetExports(entryPoint string) (string, bool) {
	data, err := exportDocs.ReadFile("docs/exports/" + entryPoint + ".md")
	if err != nil {
		return "", false
	}
	return string(data), true
}

// ListAPIDocs returns the names of all available API reference documents.
func ListAPIDocs() []string {
	return listDocs(apiDocs, "docs/api")
}

// ListGuides returns the names of all available guide documents.
func ListGuides() []string {
	return listDocs(guideDocs, "docs/guides")
}

// ListPatterns returns the names of all available pattern documents.
func ListPatterns() []string {
	return listDocs(patternDocs, "docs/patterns")
}

// ListExports returns the names of all available export documents.
func ListExports() []string {
	return listDocs(exportDocs, "docs/exports")
}

func listDocs(fs embed.FS, dir string) []string {
	entries, err := fs.ReadDir(dir)
	if err != nil {
		return nil
	}
	var names []string
	for _, e := range entries {
		if !e.IsDir() {
			name := e.Name()
			// Strip .md extension
			if len(name) > 3 && name[len(name)-3:] == ".md" {
				name = name[:len(name)-3]
			}
			names = append(names, name)
		}
	}
	return names
}
