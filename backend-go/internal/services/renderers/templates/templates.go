package templates

import (
	"embed"
	"fmt"
	"html/template"
	"strings"
)

//go:embed *.html
var templateFiles embed.FS

type TemplateStore struct {
	templates map[string]*template.Template
}

func NewTemplateStore() (*TemplateStore, error) {
	store := &TemplateStore{
		templates: make(map[string]*template.Template),
	}
	
	entries, err := templateFiles.ReadDir(".")
	if err != nil {
		return nil, fmt.Errorf("failed to read embedded templates: %w", err)
	}
	
	for _, entry := range entries {
		if !strings.HasSuffix(entry.Name(), ".html") {
			continue
		}
		
		content, err := templateFiles.ReadFile(entry.Name())
		if err != nil {
			return nil, fmt.Errorf("failed to read template %s: %w", entry.Name(), err)
		}
		
		tmpl, err := template.New(entry.Name()).Parse(string(content))
		if err != nil {
			return nil, fmt.Errorf("failed to parse template %s: %w", entry.Name(), err)
		}
		
		store.templates[entry.Name()] = tmpl
	}
	
	return store, nil
}

func (ts *TemplateStore) Get(name string) (*template.Template, error) {
	tmpl, exists := ts.templates[name]
	if !exists {
		return nil, fmt.Errorf("template %s not found", name)
	}
	return tmpl, nil
}

func (ts *TemplateStore) List() []string {
	var names []string
	for name := range ts.templates {
		names = append(names, name)
	}
	return names
}