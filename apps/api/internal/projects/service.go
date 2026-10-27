package projects

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
)

var nonSlugRegex = regexp.MustCompile(`[^a-z0-9-]+`)

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

	baseSlug := generateSlug(name)
	if baseSlug == "" {
		baseSlug = "project"
	}

	slug := baseSlug
	// Ensure slug uniqueness scoped per user (or globally if shared)
	for i := 0; i < 5; i++ {
		existing, err := s.repository.FindByUserAndSlug(ctx, userID, slug)
		if err == nil && existing != nil {
			slug = fmt.Sprintf("%s-%d", baseSlug, time.Now().Unix()%10000+int64(i))
			continue
		}
		break
	}

	project, err := s.repository.Create(ctx, userID, name, slug)
	if err != nil {
		return nil, fmt.Errorf("create project: %w", err)
	}

	return project, nil
}

func generateSlug(name string) string {
	lower := strings.ToLower(name)
	hyphenated := strings.ReplaceAll(lower, " ", "-")
	cleaned := nonSlugRegex.ReplaceAllString(hyphenated, "")
	return strings.Trim(cleaned, "-")
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

func (s *Service) GetProjectByIDForUser(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*Project, error) {
	return s.repository.FindByIDForUser(ctx, id, userID)
}

func (s *Service) GetProjectBySlug(ctx context.Context, slug string) (*Project, error) {
	return s.repository.FindBySlug(ctx, slug)
}

func (s *Service) GetProjectByUserAndSlug(ctx context.Context, userID uuid.UUID, slug string) (*Project, error) {
	return s.repository.FindByUserAndSlug(ctx, userID, slug)
}

func (s *Service) DeleteProject(ctx context.Context, id uuid.UUID) error {
	return s.repository.Delete(ctx, id)
}

func (s *Service) DeleteProjectForUser(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repository.DeleteForUser(ctx, id, userID)
}
