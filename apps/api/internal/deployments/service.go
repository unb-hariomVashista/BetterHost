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

	targetDir := normalizeArtifactPath(dep.ArtifactPath)
	if targetDir == "" {
		targetDir = filepath.ToSlash(filepath.Join(getStorageDir(), "deployments", strings.ToLower(dep.Slug)))
	}

	dbFiles, _ := s.repository.GetDeploymentFilesByDeploymentID(ctx, dep.ID)

	// If files are missing from DB (older deployment created before DB persistence was added), backfill DB from disk if disk files exist
	if len(dbFiles) == 0 {
		if fi, statErr := os.Stat(targetDir); statErr == nil && fi.IsDir() {
			_ = filepath.WalkDir(targetDir, func(path string, d os.DirEntry, walkErr error) error {
				if walkErr != nil || d.IsDir() {
					return nil
				}
				rel, relErr := filepath.Rel(targetDir, path)
				if relErr != nil {
					return nil
				}
				content, readErr := os.ReadFile(path)
				if readErr == nil {
					relPath := filepath.ToSlash(rel)
					_ = s.repository.SaveDeploymentFile(ctx, dep.ID, relPath, content, "")
				}
				return nil
			})
			dbFiles, _ = s.repository.GetDeploymentFilesByDeploymentID(ctx, dep.ID)
		}
	}

	if len(dbFiles) > 0 {
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
		log.Printf("Redeploy failed: No deployment files found in DB or disk for deployment %s (%s)", dep.ID, dep.Slug)
		_ = s.repository.UpdateStatus(ctx, dep.ID, StatusFailed, "", "")
		return nil, fmt.Errorf("no archived deployment files found in database or disk for '%s'. Please upload a new zip file for this deployment", dep.Slug)
	}

	return s.repository.FindByID(ctx, deploymentID)
}
