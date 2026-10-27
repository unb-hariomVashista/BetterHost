package auth

import (
	"encoding/json"
	"net/http"
	"strings"

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

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var payload RegisterPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	payload.Email = strings.TrimSpace(payload.Email)
	if payload.Email == "" || payload.Password == "" {
		response.Error(w, http.StatusBadRequest, "email and password are required")
		return
	}

	res, err := h.service.Register(r.Context(), payload)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}

	response.JSON(w, http.StatusCreated, res)
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.Error(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var payload LoginPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if strings.TrimSpace(payload.Email) == "" || payload.Password == "" {
		response.Error(w, http.StatusBadRequest, "email and password are required")
		return
	}

	res, err := h.service.Login(r.Context(), payload)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "invalid email or password")
		return
	}

	response.JSON(w, http.StatusOK, res)
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		response.Error(w, http.StatusUnauthorized, "authorization header required")
		return
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenStr == authHeader || strings.TrimSpace(tokenStr) == "" {
		response.Error(w, http.StatusUnauthorized, "bearer token required")
		return
	}

	user, err := h.service.GetUserFromToken(r.Context(), tokenStr)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, "invalid or expired token")
		return
	}

	response.JSON(w, http.StatusOK, user)
}
