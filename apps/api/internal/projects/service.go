package projects

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

type Service struct {
	repository *Repository
}

func NewService(repository *Repository) *Service {
	return &Service{
		repository: repository,
	}
}

func (s *Service) CreateProject(ctx context.Context, userID uuid.UUID, name string) (*Project, error) {
	name = strings.TrimSpace(name)

	if name == "" {
		return nil, fmt.Errorf("project name cannot be empty")
	}

	slug := generateSlug(name)

	project, err := s.repository.Create(ctx, userID, name, slug)
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

func (s *Service) ListProjectsForUser(ctx context.Context, userID uuid.UUID) ([]Project, error) {
	projects, err := s.repository.FindByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list user projects: %w", err)
	}

	return projects, nil
}

func (s *Service) GetProjectByID(ctx context.Context, id uuid.UUID) (*Project, error) {
	return s.repository.FindByID(ctx, id)
}

func (s *Service) GetProjectBySlug(ctx context.Context, slug string) (*Project, error) {
	return s.repository.FindBySlug(ctx, slug)
}

func (s *Service) DeleteProject(ctx context.Context, id uuid.UUID) error {
	return s.repository.Delete(ctx, id)
}

func (s *Service) DeleteProjectForUser(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repository.DeleteForUser(ctx, id, userID)
}
