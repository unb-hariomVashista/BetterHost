package projects

import (
	"context"
	"fmt"
	"strings"
)

type Service struct {
	repository *Repository
}

func NewService(repository *Repository) *Service {
	return &Service{
		repository: repository,
	}
}

func (s *Service) CreateProject(ctx context.Context, name string) (*Project, error) {
	name = strings.TrimSpace(name)

	if name == "" {
		return nil, fmt.Errorf("project name cannot be empty")
	}

	slug := generateSlug(name)

	project, err := s.repository.Create(ctx, name, slug)
	if err != nil {
		return nil, fmt.Errorf("create project: %w", err)
	}

	return project, nil
}

func generateSlug(name string) string {
	return strings.ToLower(
		strings.ReplaceAll(name, " ", "-"),
	)
}

func (s *Service) ListProjects(ctx context.Context) ([]Project, error) {
	projects, err := s.repository.FindAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("list projects: %w", err)
	}

	return projects, nil
}
