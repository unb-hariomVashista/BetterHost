package deployments

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/unb-hariomVashista/BetterHost.git/internal/projects"
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
	projectIDString := r.PathValue("projectId")

	projectID, err := uuid.Parse(projectIDString)
	if err != nil {
		http.Error(w, "invalid project id", http.StatusBadRequest)
		return
	}

	// Fetch project slug
	proj, err := h.projectService.GetProjectByID(r.Context(), projectID)
	if err != nil || proj == nil {
		http.Error(w, "project not found", http.StatusNotFound)
		return
	}

	// Parse multipart form (max 50MB)
	if err := r.ParseMultipartForm(50 << 20); err != nil {
		http.Error(w, "failed to parse multipart form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "zip file is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	if filepath.Ext(header.Filename) != ".zip" {
		http.Error(w, "only .zip files are allowed", http.StatusBadRequest)
		return
	}

	deploymentSlug := r.FormValue("slug")

	// Ensure staging directory exists
	stagingDir := filepath.Join("storage", "uploads")
	if err := os.MkdirAll(stagingDir, 0755); err != nil {
		http.Error(w, "failed to create staging directory", http.StatusInternalServerError)
		return
	}

	// Save zip file to staging path
	tempFile, err := os.CreateTemp(stagingDir, "upload-*.zip")
	if err != nil {
		http.Error(w, "failed to save upload file", http.StatusInternalServerError)
		return
	}
	defer tempFile.Close()

	if _, err := io.Copy(tempFile, file); err != nil {
		http.Error(w, "failed to write file to disk", http.StatusInternalServerError)
		return
	}

	// Create deployment & enqueue job
	deployment, err := h.service.CreateDeploymentWithZip(
		r.Context(),
		projectID,
		proj.Slug,
		deploymentSlug,
		tempFile.Name(),
	)

	if err != nil {
		log.Printf("error creating deployment: %v", err)
		http.Error(w, fmt.Sprintf("failed to create deployment: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(deployment)
}

func (h *Handler) ListAll(w http.ResponseWriter, r *http.Request) {
	deps, err := h.service.ListAllDeployments(r.Context())
	if err != nil {
		http.Error(w, "failed to fetch all deployments", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(deps)
}

func (h *Handler) ListByProject(w http.ResponseWriter, r *http.Request) {
	projectIDString := r.PathValue("projectId")

	projectID, err := uuid.Parse(projectIDString)
	if err != nil {
		http.Error(w, "invalid project id", http.StatusBadRequest)
		return
	}

	deps, err := h.service.ListDeploymentsByProjectID(r.Context(), projectID)
	if err != nil {
		http.Error(w, "failed to fetch deployments", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(deps)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "invalid deployment id", http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteDeployment(r.Context(), id); err != nil {
		log.Printf("error deleting deployment: %v", err)
		http.Error(w, "failed to delete deployment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
