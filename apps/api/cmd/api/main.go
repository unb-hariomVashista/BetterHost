package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"

	"github.com/unb-hariomVashista/BetterHost.git/internal/auth"
	"github.com/unb-hariomVashista/BetterHost.git/internal/db"
	"github.com/unb-hariomVashista/BetterHost.git/internal/deployments"
	"github.com/unb-hariomVashista/BetterHost.git/internal/projects"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
		origin := r.Header.Get("Origin")

		if allowedOrigin != "" {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		} else if origin != "" {
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

	// Auth routes
	mux.HandleFunc("POST /api/v1/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("GET /api/v1/auth/me", authHandler.Me)

	// Projects API routes
	mux.HandleFunc("POST /api/v1/projects", projectHandler.Create)
	mux.HandleFunc("GET /api/v1/projects", projectHandler.List)
	mux.HandleFunc("DELETE /api/v1/projects/{id}", projectHandler.Delete)

	// Deployments API routes
	mux.HandleFunc("GET /api/v1/deployments", deploymentHandler.ListAll)
	mux.HandleFunc("POST /api/v1/projects/{projectId}/deployments", deploymentHandler.CreateWithZip)
	mux.HandleFunc("GET /api/v1/projects/{projectId}/deployments", deploymentHandler.ListByProject)
	mux.HandleFunc("DELETE /api/v1/deployments/{id}", deploymentHandler.Delete)

	// Static Project & Deployment Route Serving (/projects/my-portfolio or /projects/my-portfolio/deploy-1)
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
