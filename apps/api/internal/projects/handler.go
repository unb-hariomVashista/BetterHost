package projects

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/unb-hariomVashista/BetterHost.git/internal/auth"
	"github.com/unb-hariomVashista/BetterHost.git/internal/response"
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
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req createProjectRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		response.Error(w, http.StatusBadRequest, "name is required")
		return
	}

	userID, ok := auth.GetUserIDFromContext(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "user authentication required")
		return
	}

	project, err := h.service.CreateProject(r.Context(), userID, req.Name)
	if err != nil {
		log.Printf("error creating project: %v", err)
		response.Error(w, http.StatusInternalServerError, "failed to create project")
		return
	}

	response.JSON(w, http.StatusCreated, project)
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		response.Error(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	userID, ok := auth.GetUserIDFromContext(r.Context())
	var projectsList []Project
	var err error

	if ok {
		projectsList, err = h.service.ListProjectsForUser(r.Context(), userID)
	} else {
		projectsList, err = h.service.ListProjects(r.Context())
	}

	if err != nil {
		log.Printf("error listing projects: %v", err)
		response.Error(w, http.StatusInternalServerError, "failed to fetch projects")
		return
	}

	if projectsList == nil {
		projectsList = []Project{}
	}

	response.JSON(w, http.StatusOK, projectsList)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		response.Error(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid project id")
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
		response.Error(w, http.StatusInternalServerError, "failed to delete project")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
