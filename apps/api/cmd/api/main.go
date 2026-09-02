package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"

	"github.com/unb-hariomVashista/BetterHost.git/internal/auth"
	"github.com/unb-hariomVashista/BetterHost.git/internal/db"
	"github.com/unb-hariomVashista/BetterHost.git/internal/deployments"
	"github.com/unb-hariomVashista/BetterHost.git/internal/projects"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := strings.TrimSuffix(r.Header.Get("Origin"), "/")

		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		} else {
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}

		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, X-Requested-With, Origin")
		w.Header().Set("Access-Control-Max-Age", "86400")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	// Load .env file for local development if present
	_ = godotenv.Load()

	ctx := context.Background()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		if os.Getenv("ENV") == "production" {
			log.Fatal("FATAL: JWT_SECRET environment variable is required in production")
		}
		log.Println("WARNING: JWT_SECRET not set, using default fallback key for local dev")
		jwtSecret = "betterhost-jwt-secret-key-change-in-prod"
	}

	pool, err := db.NewPostgresPool(ctx, databaseURL)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer pool.Close()

	// Auth service setup
	authRepository := auth.NewRepository(pool)
	jwtService := auth.NewJWTService(jwtSecret, 24*time.Hour)
	authService := auth.NewService(authRepository, jwtService)
	authHandler := auth.NewHandler(authService)

	// Projects service setup
	projectRepository := projects.NewRepository(pool)
	projectService := projects.NewService(projectRepository)
	projectHandler := projects.NewHandler(projectService)

	// Deployments worker pool setup (5 concurrent workers)
	deploymentRepository := deployments.NewRepository(pool)
	workerPool := deployments.NewWorkerPool(deploymentRepository, 100, 5)
	workerPool.Start(ctx)

	deploymentService := deployments.NewService(deploymentRepository, workerPool)
	deploymentHandler := deployments.NewHandler(deploymentService, projectService)
	deploymentServer := deployments.NewServer(deploymentService, projectService)

	mux := http.NewServeMux()

	// Auth routes (Public)
	mux.HandleFunc("POST /api/v1/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("GET /api/v1/auth/me", authHandler.Me)

	// Projects API routes (Protected)
	mux.HandleFunc("POST /api/v1/projects", jwtService.AuthMiddleware(projectHandler.Create))
	mux.HandleFunc("GET /api/v1/projects", jwtService.AuthMiddleware(projectHandler.List))
	mux.HandleFunc("DELETE /api/v1/projects/{id}", jwtService.AuthMiddleware(projectHandler.Delete))

	// Deployments API routes (Protected)
	mux.HandleFunc("GET /api/v1/deployments", jwtService.AuthMiddleware(deploymentHandler.ListAll))
	mux.HandleFunc("POST /api/v1/projects/{projectId}/deployments", jwtService.AuthMiddleware(deploymentHandler.CreateWithZip))
	mux.HandleFunc("GET /api/v1/projects/{projectId}/deployments", jwtService.AuthMiddleware(deploymentHandler.ListByProject))
	mux.HandleFunc("POST /api/v1/deployments/{id}/redeploy", jwtService.AuthMiddleware(deploymentHandler.Redeploy))
	mux.HandleFunc("DELETE /api/v1/deployments/{id}", jwtService.AuthMiddleware(deploymentHandler.Delete))

	// Static Project & Deployment Route Serving (Public preview URLs e.g. /projects/my-portfolio)
	mux.HandleFunc("GET /projects/", deploymentServer.ServeProjectOrDeployment)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:    ":" + port,
		Handler: corsMiddleware(mux),
	}

	log.Printf("BetterHost API running on :%s", port)

	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
