package deployments

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	repository *Repository
	workerPool *WorkerPool
}

func NewService(repository *Repository, workerPool *WorkerPool) *Service {
	return &Service{
		repository: repository,
		workerPool: workerPool,
	}
}

func (s *Service) CreateDeploymentWithZip(
	ctx context.Context,
	projectID uuid.UUID,
	projectSlug string,
	deploymentSlug string,
	zipFilePath string,
) (*Deployment, error) {
	deploymentSlug = strings.TrimSpace(strings.ToLower(deploymentSlug))
	if deploymentSlug == "" {
		deploymentSlug = fmt.Sprintf("deploy-%d", time.Now().Unix())
	} else {
		// Check if slug exists; if so, append unique timestamp suffix to prevent UNIQUE constraint collisions
		existing, err := s.repository.FindByProjectSlugAndDeploymentSlug(ctx, projectSlug, deploymentSlug)
		if err == nil && existing != nil {
			deploymentSlug = fmt.Sprintf("%s-%d", deploymentSlug, time.Now().Unix()%10000)
		}
	}

	entrypoint := "index.html"
	artifactPath := ""

	// Step 1: Create DB deployment record with QUEUED status
	deployment, err := s.repository.Create(
		ctx,
		projectID,
		deploymentSlug,
		entrypoint,
		artifactPath,
	)

	if err != nil {
		return nil, fmt.Errorf("create deployment record: %w", err)
	}

	// Step 2: Enqueue async deployment job to worker pool
	if s.workerPool != nil {
		s.workerPool.Enqueue(DeploymentJob{
			DeploymentID:   deployment.ID,
			ProjectID:      projectID,
			ProjectSlug:    projectSlug,
			DeploymentSlug: deploymentSlug,
			ZipFilePath:    zipFilePath,
		})
	}

	return deployment, nil
}

func (s *Service) ListAllDeployments(ctx context.Context) ([]DeploymentWithProject, error) {
	return s.repository.FindAll(ctx)
}

func (s *Service) ListDeploymentsByProjectID(ctx context.Context, projectID uuid.UUID) ([]Deployment, error) {
	return s.repository.FindByProjectID(ctx, projectID)
}

func (s *Service) GetDeploymentBySlugs(ctx context.Context, projectSlug, deploymentSlug string) (*Deployment, error) {
	return s.repository.FindByProjectSlugAndDeploymentSlug(ctx, projectSlug, deploymentSlug)
}

func (s *Service) DeleteDeployment(ctx context.Context, id uuid.UUID) error {
	return s.repository.Delete(ctx, id)
}
