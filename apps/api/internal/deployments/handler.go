package deployments

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

type createDeploymentRequest struct {
	Slug       string `json:"slug"`
	Entrypoint string `json:"entrypoint"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	projectIDString := r.PathValue("projectId")

	projectID, err := uuid.Parse(projectIDString)
	if err != nil {
		http.Error(w, "invalid project id", http.StatusBadRequest)
		return
	}

	var req createDeploymentRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	deployment, err := h.service.CreateDeployment(
		r.Context(),
		projectID,
		req.Slug,
		req.Entrypoint,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	if err := json.NewEncoder(w).Encode(deployment); err != nil {
		return
	}
}
