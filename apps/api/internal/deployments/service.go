package deployments

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
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

func (s *Service) Redeploy(ctx context.Context, deploymentID uuid.UUID) (*Deployment, error) {
	dep, err := s.repository.FindByID(ctx, deploymentID)
	if err != nil || dep == nil {
		return nil, fmt.Errorf("deployment not found")
	}

	_ = s.repository.UpdateStatus(ctx, dep.ID, StatusQueued, dep.ArtifactPath, dep.Entrypoint)

	dbFiles, _ := s.repository.GetDeploymentFilesByDeploymentID(ctx, dep.ID)
	if len(dbFiles) > 0 {
		targetDir := normalizeArtifactPath(dep.ArtifactPath)
		if targetDir == "" {
			targetDir = filepath.Join(getStorageDir(), "deployments", strings.ToLower(dep.Slug))
		}

		_ = os.MkdirAll(targetDir, 0755)
		for _, f := range dbFiles {
			filePath := filepath.Join(targetDir, filepath.FromSlash(f.Path))
			_ = os.MkdirAll(filepath.Dir(filePath), 0755)
			_ = os.WriteFile(filePath, f.Content, 0644)
		}

		autoFlattenToEntrypoint(targetDir)
		entrypoint := "index.html"
		if idxPath, _, found := resolveIndexFile(targetDir); found {
			rel, _ := filepath.Rel(targetDir, idxPath)
			entrypoint = rel
		}

		_ = s.repository.UpdateStatus(ctx, dep.ID, StatusReady, targetDir, entrypoint)
	} else {
		_ = s.repository.UpdateStatus(ctx, dep.ID, StatusFailed, "", "")
	}

	return s.repository.FindByID(ctx, deploymentID)
}
