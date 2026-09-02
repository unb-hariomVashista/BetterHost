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

func getStorageDir() string {
	if s := os.Getenv("STORAGE_DIR"); s != "" {
		return s
	}
	return "storage"
}

func autoFlattenToEntrypoint(targetDir string) {
	os.RemoveAll(filepath.Join(targetDir, "__MACOSX"))

	candidates := []string{"index.html", "index.php", "index.htm", "default.html"}
	var bestDir string
	shallowestDepth := 999

	_ = filepath.WalkDir(targetDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			name := d.Name()
			if strings.HasPrefix(name, ".") || name == "__MACOSX" {
				return filepath.SkipDir
			}
			return nil
		}

		filename := strings.ToLower(d.Name())
		for _, c := range candidates {
			if filename == c {
				dir := filepath.Dir(path)
				rel, _ := filepath.Rel(targetDir, dir)
				depth := 0
				if rel != "." {
					depth = len(strings.Split(filepath.ToSlash(rel), "/"))
				}
				if depth < shallowestDepth {
					shallowestDepth = depth
					bestDir = dir
				}
			}
		}
		return nil
	})

	if bestDir != "" && bestDir != targetDir {
		entries, err := os.ReadDir(bestDir)
		if err == nil {
			for _, e := range entries {
				oldP := filepath.Join(bestDir, e.Name())
				newP := filepath.Join(targetDir, e.Name())
				os.Rename(oldP, newP)
			}
		}
	}
}

func (wp *WorkerPool) processJob(ctx context.Context, job DeploymentJob) {
	defer os.Remove(job.ZipFilePath)
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Panic encountered during deployment %s: %v", job.DeploymentID, r)
			wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusFailed, "", "")
		}
	}()

	// Step 1: Update status to DEPLOYING
	if err := wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusDeploying, "", ""); err != nil {
		log.Printf("Failed to update status to DEPLOYING for %s: %v", job.DeploymentID, err)
	}

	// Target extraction directory
	targetDir := filepath.ToSlash(filepath.Join(getStorageDir(), "deployments", strings.ToLower(job.ProjectSlug), strings.ToLower(job.DeploymentSlug)))

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
		rawPath := strings.TrimPrefix(strings.TrimPrefix(file.Name, "/"), "\\")
		cleanPath := filepath.Clean(rawPath)
		if strings.HasPrefix(cleanPath, "..") {
			log.Printf("Security alert: Zip-Slip attempt detected in file %s", file.Name)
			wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusFailed, "", "")
			return
		}

		if strings.HasPrefix(cleanPath, "__MACOSX") || strings.HasPrefix(filepath.Base(cleanPath), "._") {
			continue
		}

		destPath := filepath.Join(targetDir, cleanPath)

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

		inFile, err := file.Open()
		if err != nil {
			log.Printf("Failed to open zip file entry %s: %v", file.Name, err)
			wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusFailed, "", "")
			return
		}

		contentBytes, err := io.ReadAll(inFile)
		inFile.Close()
		if err != nil {
			log.Printf("Failed to read zip file entry %s: %v", file.Name, err)
			wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusFailed, "", "")
			return
		}

		if err := os.WriteFile(destPath, contentBytes, file.Mode()); err != nil {
			log.Printf("Failed to write file %s: %v", destPath, err)
			wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusFailed, "", "")
			return
		}
	}

	// Step 2: Auto-flatten nested parent folders to find entrypoint
	autoFlattenToEntrypoint(targetDir)

	// Step 3: Persist finalized files to DB after flattening
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
			if err := wp.repository.SaveDeploymentFile(ctx, job.DeploymentID, relPath, content, ""); err != nil {
				log.Printf("Warning: failed to save deployment file %s to DB: %v", relPath, err)
			}
		}
		return nil
	})

	// Step 4: Entrypoint Detection
	entrypoint := "index.html"
	foundEntrypoint := false
	candidates := []string{"index.html", "index.php", "index.htm", "default.html"}

	rootEntries, _ := os.ReadDir(targetDir)
	for _, candidate := range candidates {
		for _, re := range rootEntries {
			if !re.IsDir() && strings.EqualFold(re.Name(), candidate) {
				entrypoint = re.Name()
				foundEntrypoint = true
				break
			}
		}
		if foundEntrypoint {
			break
		}
	}

	// Fallback to any html/php file if standard entrypoint name not found
	if !foundEntrypoint {
		for _, re := range rootEntries {
			if !re.IsDir() {
				ext := strings.ToLower(filepath.Ext(re.Name()))
				if ext == ".html" || ext == ".php" || ext == ".htm" {
					entrypoint = re.Name()
					foundEntrypoint = true
					break
				}
			}
		}
	}

	if !foundEntrypoint {
		log.Printf("Warning: no index.html or index.php entrypoint found at root of deployment %s", job.DeploymentID)
	}

	// Step 5: Mark Deployment as READY
	if err := wp.repository.UpdateStatus(ctx, job.DeploymentID, StatusReady, targetDir, entrypoint); err != nil {
		log.Printf("Failed to set status READY for deployment %s: %v", job.DeploymentID, err)
		return
	}

	log.Printf("Successfully deployed deployment %s (%s/%s) with entrypoint '%s' to %s", job.DeploymentID, job.ProjectSlug, job.DeploymentSlug, entrypoint, targetDir)
}
