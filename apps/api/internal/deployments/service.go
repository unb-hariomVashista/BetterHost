package deployments

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

func (s *Service) CreateDeployment(
	ctx context.Context,
	projectID uuid.UUID,
	slug string,
	entrypoint string,
) (*Deployment, error) {
	slug = strings.TrimSpace(slug)
	entrypoint = strings.TrimSpace(entrypoint)

	if slug == "" {
		return nil, fmt.Errorf("deployment slug cannot be empty")
	}

	if entrypoint == "" {
		return nil, fmt.Errorf("deployment entrypoint cannot be empty")
	}

	artifactPath := ""

	deployment, err := s.repository.Create(
		ctx,
		projectID,
		slug,
		entrypoint,
		artifactPath,
	)

	if err != nil {
		return nil, fmt.Errorf("create deployment: %w", err)
	}

	return deployment, nil
}
