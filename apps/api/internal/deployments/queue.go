package deployments

import (
	"archive/zip"
	"context"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

type DeploymentJob struct {
	DeploymentID   uuid.UUID
	ProjectID      uuid.UUID
	ProjectSlug    string
	DeploymentSlug string
	ZipFilePath    string
}

type WorkerPool struct {
	jobQueue   chan DeploymentJob
	repository *Repository
	numWorkers int
}

func NewWorkerPool(repository *Repository, bufferSize int, numWorkers int) *WorkerPool {
	return &WorkerPool{
		jobQueue:   make(chan DeploymentJob, bufferSize),
		repository: repository,
		numWorkers: numWorkers,
	}
}

func (wp *WorkerPool) Start(ctx context.Context) {
	log.Printf("Starting %d deployment worker goroutines...", wp.numWorkers)
	for i := 1; i <= wp.numWorkers; i++ {
		workerID := i
		go func(id int) {
			for {
				select {
				case <-ctx.Done():
					log.Printf("[Worker %d] Stopping...", id)
					return
				case job, ok := <-wp.jobQueue:
					if !ok {
						return
					}
					log.Printf("[Worker %d] Picked up job for deployment %s (%s/%s)", id, job.DeploymentID, job.ProjectSlug, job.DeploymentSlug)
					wp.processJob(ctx, job)
				}
			}
		}(workerID)
	}
}

func (wp *WorkerPool) Enqueue(job DeploymentJob) {
	wp.jobQueue <- job
	log.Printf("Enqueued deployment job %s to channel", job.DeploymentID)
}

func (wp *WorkerPool) processJob(ctx context.Context, job DeploymentJob) {
	defer os.Remove(job.ZipFilePath)

	// Step 1: Update status to DEPLOYING
	if err := wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusDeploying, "", ""); err != nil {
		log.Printf("Failed to update status to DEPLOYING for %s: %v", job.DeploymentID, err)
	}

	// Target extraction directory
	targetDir := filepath.Join("storage", "deployments", strings.ToLower(job.ProjectSlug), strings.ToLower(job.DeploymentSlug))

	if err := os.MkdirAll(targetDir, 0755); err != nil {
		log.Printf("Failed to create target dir %s: %v", targetDir, err)
		wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusFailed, "", "")
		return
	}

	// Open Zip reader
	reader, err := zip.OpenReader(job.ZipFilePath)
	if err != nil {
		log.Printf("Failed to open zip archive %s: %v", job.ZipFilePath, err)
		wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusFailed, "", "")
		return
	}
	defer reader.Close()

	// Extract files with Zip-Slip protection
	for _, file := range reader.File {
		// Clean and check relative path (Zip Slip attack defense)
		rawPath := strings.TrimPrefix(strings.TrimPrefix(file.Name, "/"), "\\")
		cleanPath := filepath.Clean(rawPath)
		if strings.HasPrefix(cleanPath, "..") {
			log.Printf("Security alert: Zip-Slip attempt detected in file %s", file.Name)
			wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusFailed, "", "")
			return
		}

		destPath := filepath.Join(targetDir, cleanPath)

		// Verify target path remains within targetDir
		if !strings.HasPrefix(destPath, filepath.Clean(targetDir)) {
			log.Printf("Security alert: Path traversal detected for %s", destPath)
			wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusFailed, "", "")
			return
		}

		if file.FileInfo().IsDir() {
			os.MkdirAll(destPath, file.Mode())
			continue
		}

		if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
			log.Printf("Failed to create parent dir for %s: %v", destPath, err)
			wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusFailed, "", "")
			return
		}

		outFile, err := os.OpenFile(destPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, file.Mode())
		if err != nil {
			log.Printf("Failed to create file %s: %v", destPath, err)
			wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusFailed, "", "")
			return
		}

		inFile, err := file.Open()
		if err != nil {
			outFile.Close()
			log.Printf("Failed to open zip file entry %s: %v", file.Name, err)
			wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusFailed, "", "")
			return
		}

		_, err = io.Copy(outFile, inFile)
		inFile.Close()
		outFile.Close()
		if err != nil {
			log.Printf("Failed to copy zip content to %s: %v", destPath, err)
			wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusFailed, "", "")
			return
		}
	}

	// Step 2: Post-extraction auto-flattening if zip contained a single wrapper directory (e.g. CBC/)
	entries, err := os.ReadDir(targetDir)
	if err == nil && len(entries) == 1 && entries[0].IsDir() {
		singleFolder := filepath.Join(targetDir, entries[0].Name())
		subEntries, subErr := os.ReadDir(singleFolder)
		if subErr == nil {
			for _, se := range subEntries {
				oldPath := filepath.Join(singleFolder, se.Name())
				newPath := filepath.Join(targetDir, se.Name())
				os.Rename(oldPath, newPath)
			}
			os.Remove(singleFolder)
		}
	}

	// Step 3: Multi-Format Entrypoint Detection (index.html > index.php > index.htm > default.html)
	entrypoint := "index.html"
	foundEntrypoint := false
	candidates := []string{"index.html", "index.php", "index.htm", "default.html"}

	for _, candidate := range candidates {
		if _, err := os.Stat(filepath.Join(targetDir, candidate)); err == nil {
			entrypoint = candidate
			foundEntrypoint = true
			break
		}
	}

	if !foundEntrypoint {
		log.Printf("Warning: no index.html or index.php entrypoint found at root of deployment %s", job.DeploymentID)
	}

	// Step 4: Mark Deployment as READY
	if err := wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusReady, targetDir, entrypoint); err != nil {
		log.Printf("Failed to set status READY for deployment %s: %v", job.DeploymentID, err)
		return
	}

	log.Printf("Successfully deployed deployment %s (%s/%s) with entrypoint '%s' to %s", job.DeploymentID, job.ProjectSlug, job.DeploymentSlug, entrypoint, targetDir)
}
