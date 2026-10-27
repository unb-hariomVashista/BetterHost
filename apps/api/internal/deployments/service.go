package deployments

import (
	"context"
	"fmt"
	"log"
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
	targetDir string,
) (*Deployment, error) {
	deploymentSlug = strings.TrimSpace(strings.ToLower(deploymentSlug))
	if deploymentSlug == "" {
		deploymentSlug = fmt.Sprintf("deploy-%d", time.Now().Unix())
	} else {
		// Clean slug format
		deploymentSlug = strings.ReplaceAll(deploymentSlug, " ", "-")
	}

	// Check if slug exists in this project; if so, append unique timestamp suffix
	existing, err := s.repository.FindByProjectIDAndSlug(ctx, projectID, deploymentSlug)
	if err == nil && existing != nil {
		deploymentSlug = fmt.Sprintf("%s-%d", deploymentSlug, time.Now().Unix()%10000)
	}

	entrypoint := "index.html"
	artifactPath := targetDir

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
			TargetDir:      targetDir,
			ZipFilePath:    zipFilePath,
		})
	}

	return deployment, nil
}

func (s *Service) ListAllDeployments(ctx context.Context) ([]DeploymentWithProject, error) {
	return s.repository.FindAll(ctx)
}

func (s *Service) ListAllDeploymentsForUser(ctx context.Context, userID uuid.UUID) ([]DeploymentWithProject, error) {
	return s.repository.FindByUserID(ctx, userID)
}

func (s *Service) ListDeploymentsByProjectID(ctx context.Context, projectID uuid.UUID) ([]Deployment, error) {
	return s.repository.FindByProjectID(ctx, projectID)
}

func (s *Service) GetDeploymentBySlugs(ctx context.Context, projectSlug, deploymentSlug string) (*Deployment, error) {
	return s.repository.FindByProjectSlugAndDeploymentSlug(ctx, projectSlug, deploymentSlug)
}

func (s *Service) GetDeploymentByUserProjectAndDeploymentSlug(ctx context.Context, userID uuid.UUID, projectSlug, deploymentSlug string) (*Deployment, error) {
	return s.repository.FindByUserProjectAndDeploymentSlug(ctx, userID, projectSlug, deploymentSlug)
}

func (s *Service) DeleteDeployment(ctx context.Context, id uuid.UUID) error {
	return s.repository.Delete(ctx, id)
}

func (s *Service) DeleteDeploymentForUser(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repository.DeleteForUser(ctx, id, userID)
}

func (s *Service) Redeploy(ctx context.Context, deploymentID uuid.UUID) (*Deployment, error) {
	dep, err := s.repository.FindByID(ctx, deploymentID)
	if err != nil || dep == nil {
		return nil, fmt.Errorf("deployment not found")
	}

	// Reset status to QUEUED
	if err := s.repository.UpdateStatus(ctx, dep.ID, StatusQueued, dep.ArtifactPath, dep.Entrypoint); err != nil {
		return nil, fmt.Errorf("failed to reset deployment status: %w", err)
	}

	// Re-extract files from DB to disk
	go func() {
		bgCtx := context.Background()
		targetDir := normalizeArtifactPath(dep.ArtifactPath)
		if targetDir == "" {
			targetDir = filepath.Join(getStorageDir(), "deployments", strings.ToLower(dep.Slug))
		}
		if err := os.MkdirAll(targetDir, 0755); err != nil {
			log.Printf("[Redeploy] Failed to recreate directory %s: %v", targetDir, err)
			_ = s.repository.UpdateStatus(bgCtx, dep.ID, StatusFailed, targetDir, dep.Entrypoint)
			return
		}

		_ = s.repository.UpdateStatus(bgCtx, dep.ID, StatusDeploying, targetDir, dep.Entrypoint)
		restored, err := s.repository.RestoreFilesToDisk(bgCtx, dep.ID, targetDir)
		if err != nil || restored == 0 {
			log.Printf("[Redeploy] Failed restoring files from DB: %v", err)
			_ = s.repository.UpdateStatus(bgCtx, dep.ID, StatusFailed, targetDir, dep.Entrypoint)
			return
		}

		_ = s.repository.UpdateStatus(bgCtx, dep.ID, StatusReady, targetDir, dep.Entrypoint)
		log.Printf("[Redeploy] Redeploy complete for %s with %d files", dep.Slug, restored)
	}()

	return s.repository.FindByID(ctx, deploymentID)
}

func (s *Service) RedeployForUser(ctx context.Context, deploymentID uuid.UUID, userID uuid.UUID) (*Deployment, error) {
	dep, err := s.repository.FindByIDForUser(ctx, deploymentID, userID)
	if err != nil || dep == nil {
		return nil, fmt.Errorf("deployment not found")
	}

	return s.Redeploy(ctx, deploymentID)
}
