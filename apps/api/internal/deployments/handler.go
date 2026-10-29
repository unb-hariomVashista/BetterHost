package deployments

import (
	"archive/zip"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/unb-hariomVashista/BetterHost.git/internal/auth"
	"github.com/unb-hariomVashista/BetterHost.git/internal/projects"
	"github.com/unb-hariomVashista/BetterHost.git/internal/response"
)

type Handler struct {
	service        *Service
	projectService *projects.Service
}

func NewHandler(service *Service, projectService *projects.Service) *Handler {
	return &Handler{
		service:        service,
		projectService: projectService,
	}
}

func (h *Handler) CreateWithZip(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	projectIDString := r.PathValue("projectId")
	projectID, err := uuid.Parse(projectIDString)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid project id")
		return
	}

	userID, ok := auth.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "user authentication required")
		return
	}

	// Fetch project scoped to user
	proj, err := h.projectService.GetProjectByIDForUser(r.Context(), projectID, userID)
	if err != nil || proj == nil {
		response.Error(w, http.StatusNotFound, "project not found")
		return
	}

	// Parse multipart form up to 500MB (in-memory limited to 32MB, rest spills to disk)
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		response.Error(w, http.StatusBadRequest, "failed to parse multipart form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		response.Error(w, http.StatusBadRequest, "zip file is required")
		return
	}
	defer file.Close()

	if filepath.Ext(header.Filename) != ".zip" {
		response.Error(w, http.StatusBadRequest, "only .zip files are allowed")
		return
	}

	deploymentSlug := strings.TrimSpace(r.FormValue("slug"))

	// Ensure staging directory exists
	stagingDir := filepath.Join(getStorageDir(), "uploads")
	if err := os.MkdirAll(stagingDir, 0755); err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to create staging directory")
		return
	}

	// Save zip file to staging path via buffered streaming
	tempFile, err := os.CreateTemp(stagingDir, "upload-*.zip")
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to save upload file")
		return
	}
	tempFilePath := tempFile.Name()

	// Stream file to disk with 64KB chunks
	buf := make([]byte, 64*1024)
	if _, err := io.CopyBuffer(tempFile, file, buf); err != nil {
		tempFile.Close()
		os.Remove(tempFilePath)
		response.Error(w, http.StatusInternalServerError, "failed to write file to disk")
		return
	}
	tempFile.Close()

	// Validate that the zip is NOT a raw framework source requiring local build
	if frameworkErr := InspectZipForBuildFrameworks(tempFilePath); frameworkErr != nil {
		os.Remove(tempFilePath)
		response.Error(w, http.StatusBadRequest, frameworkErr.Error())
		return
	}

	// Construct user-scoped target directory: storage/deployments/<userID>/<projectSlug>/<deploymentSlug>
	targetDir := filepath.ToSlash(filepath.Join(
		getStorageDir(),
		"deployments",
		userID.String(),
		strings.ToLower(proj.Slug),
		strings.ToLower(deploymentSlug),
	))

	// Create deployment & enqueue job
	deployment, err := h.service.CreateDeploymentWithZip(
		r.Context(),
		projectID,
		proj.Slug,
		deploymentSlug,
		tempFilePath,
		targetDir,
	)

	if err != nil {
		os.Remove(tempFilePath)
		log.Printf("error creating deployment: %v", err)
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("failed to create deployment: %v", err))
		return
	}

	response.JSON(w, http.StatusAccepted, deployment)
}

func (h *Handler) ListAll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID, ok := auth.GetUserIDFromContext(r.Context())
	var deps []DeploymentWithProject
	var err error

	if ok {
		deps, err = h.service.ListAllDeploymentsForUser(r.Context(), userID)
	} else {
		deps, err = h.service.ListAllDeployments(r.Context())
	}

	if err != nil {
		log.Printf("error fetching all deployments: %v", err)
		response.Error(w, http.StatusInternalServerError, "failed to fetch deployments")
		return
	}

	if deps == nil {
		deps = []DeploymentWithProject{}
	}

	response.JSON(w, http.StatusOK, deps)
}

func (h *Handler) ListByProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	projectIDString := r.PathValue("projectId")
	projectID, err := uuid.Parse(projectIDString)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid project id")
		return
	}

	userID, ok := auth.GetUserIDFromContext(r.Context())
	if ok {
		proj, err := h.projectService.GetProjectByIDForUser(r.Context(), projectID, userID)
		if err != nil || proj == nil {
			response.Error(w, http.StatusNotFound, "project not found")
			return
		}
	}

	deps, err := h.service.ListDeploymentsByProjectID(r.Context(), projectID)
	if err != nil {
		log.Printf("error fetching deployments for project: %v", err)
		response.Error(w, http.StatusInternalServerError, "failed to fetch deployments")
		return
	}

	if deps == nil {
		deps = []Deployment{}
	}

	response.JSON(w, http.StatusOK, deps)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		response.Error(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid deployment id")
		return
	}

	userID, ok := auth.GetUserIDFromContext(r.Context())
	if ok {
		err = h.service.DeleteDeploymentForUser(r.Context(), id, userID)
	} else {
		err = h.service.DeleteDeployment(r.Context(), id)
	}

	if err != nil {
		log.Printf("error deleting deployment: %v", err)
		response.Error(w, http.StatusInternalServerError, "failed to delete deployment")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Redeploy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid deployment id")
		return
	}

	userID, ok := auth.GetUserIDFromContext(r.Context())
	var dep *Deployment

	if ok {
		dep, err = h.service.RedeployForUser(r.Context(), id, userID)
	} else {
		dep, err = h.service.Redeploy(r.Context(), id)
	}

	if err != nil {
		log.Printf("error redeploying: %v", err)
		response.Error(w, http.StatusInternalServerError, "failed to redeploy")
		return
	}

	response.JSON(w, http.StatusOK, dep)
}

func (h *Handler) DownloadZip(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid deployment id")
		return
	}

	userID, ok := auth.GetUserIDFromContext(r.Context())
	var dep *Deployment
	if ok {
		dep, err = h.service.GetDeploymentByIDForUser(r.Context(), id, userID)
	} else {
		dep, err = h.service.GetDeploymentByID(r.Context(), id)
	}

	if err != nil || dep == nil {
		response.Error(w, http.StatusNotFound, "deployment not found")
		return
	}

	// 1. Check if artifact files exist on disk
	diskDir := normalizeArtifactPath(dep.ArtifactPath)
	hasDiskFiles := false
	if diskDir != "" {
		if fi, statErr := os.Stat(diskDir); statErr == nil && fi.IsDir() {
			entries, _ := os.ReadDir(diskDir)
			if len(entries) > 0 {
				hasDiskFiles = true
			}
		}
	}

	// If not on disk, restore to disk from database
	if !hasDiskFiles {
		if diskDir == "" {
			diskDir = filepath.Join(getStorageDir(), "deployments", strings.ToLower(dep.Slug))
		}
		_ = os.MkdirAll(diskDir, 0755)
		restoredCount, _ := h.service.repository.RestoreFilesToDisk(r.Context(), dep.ID, diskDir)
		if restoredCount > 0 {
			hasDiskFiles = true
		}
	}

	fileName := fmt.Sprintf("%s.zip", strings.ToLower(dep.Slug))
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, fileName))

	zipWriter := zip.NewWriter(w)
	defer zipWriter.Close()

	if hasDiskFiles {
		// Stream zip directly from disk
		err = filepath.WalkDir(diskDir, func(path string, d os.DirEntry, walkErr error) error {
			if walkErr != nil || d.IsDir() {
				return nil
			}
			rel, relErr := filepath.Rel(diskDir, path)
			if relErr != nil {
				return nil
			}
			rel = filepath.ToSlash(rel)

			fi, infoErr := d.Info()
			if infoErr != nil {
				return nil
			}

			header, zipHeadErr := zip.FileInfoHeader(fi)
			if zipHeadErr != nil {
				return nil
			}
			header.Name = rel
			header.Method = zip.Deflate

			writer, createErr := zipWriter.CreateHeader(header)
			if createErr != nil {
				return createErr
			}

			file, openErr := os.Open(path)
			if openErr != nil {
				return nil
			}
			defer file.Close()

			_, _ = io.Copy(writer, file)
			return nil
		})

		if err != nil {
			log.Printf("error streaming zip from disk: %v", err)
		}
		return
	}

	// 2. Fallback: stream files directly from DB records if disk is unavailable
	dbFiles, dbErr := h.service.repository.GetDeploymentFilesByDeploymentID(r.Context(), dep.ID)
	if dbErr != nil || len(dbFiles) == 0 {
		log.Printf("no files found for deployment %s on disk or in DB", dep.ID)
		return
	}

	for _, f := range dbFiles {
		writer, createErr := zipWriter.Create(f.Path)
		if createErr != nil {
			continue
		}
		_, _ = writer.Write(f.Content)
	}
}
