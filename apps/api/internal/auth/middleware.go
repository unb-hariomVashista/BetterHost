package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/unb-hariomVashista/BetterHost.git/internal/response"
)

type contextKey string

const (
	UserIDContextKey    contextKey = "user_id"
	UserEmailContextKey contextKey = "user_email"
)

func (s *JWTService) AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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

		claims, err := s.ValidateToken(tokenStr)
		if err != nil || claims == nil {
			response.Error(w, http.StatusUnauthorized, "invalid or expired token")
			return
		}

		ctx := context.WithValue(r.Context(), UserIDContextKey, claims.UserID)
		ctx = context.WithValue(ctx, UserEmailContextKey, claims.Email)

		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func GetUserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(UserIDContextKey).(uuid.UUID)
	return id, ok
}
