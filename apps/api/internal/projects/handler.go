package projects

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/unb-hariomVashista/BetterHost.git/internal/auth"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

type createProjectRequest struct {
	Name string `json:"name"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req createProjectRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	userID, ok := auth.GetUserIDFromContext(r.Context())
	var project *Project
	var err error

	if ok {
		project, err = h.service.CreateProject(r.Context(), userID, req.Name)
	} else {
		project, err = h.service.CreateProject(r.Context(), uuid.Nil, req.Name)
	}

	if err != nil {
		log.Printf("error creating project: %v", err)
		http.Error(w, "failed to create project", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(project)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := auth.GetUserIDFromContext(r.Context())
	var projectsList []Project
	var err error

	if ok {
		projectsList, err = h.service.ListProjectsForUser(r.Context(), userID)
	} else {
		projectsList, err = h.service.ListProjects(r.Context())
	}

	if err != nil {
		http.Error(w, "failed to fetch projects", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(projectsList)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "invalid project id", http.StatusBadRequest)
		return
	}

	userID, ok := auth.GetUserIDFromContext(r.Context())
	if ok {
		err = h.service.DeleteProjectForUser(r.Context(), id, userID)
	} else {
		err = h.service.DeleteProject(r.Context(), id)
	}

	if err != nil {
		log.Printf("error deleting project: %v", err)
		http.Error(w, "failed to delete project", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
