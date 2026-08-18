package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"github.com/unb-hariomVashista/BetterHost.git/apps/api/internal/db"
	"github.com/unb-hariomVashista/BetterHost.git/apps/api/internal/deployments"
	"github.com/unb-hariomVashista/BetterHost.git/apps/api/internal/projects"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("warning: .env file not found")
	}

	ctx := context.Background()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	pool, err := db.NewPostgresPool(ctx, databaseURL)
	if err != nil {
		log.Fatalf("database connection failed: %v", err)
	}
	defer pool.Close()

	projectRepository := projects.NewRepository(pool)
	projectService := projects.NewService(projectRepository)
	projectHandler := projects.NewHandler(projectService)

	deploymentRepository := deployments.NewRepository(pool)
	deploymentService := deployments.NewService(deploymentRepository)
	deploymentHandler := deployments.NewHandler(deploymentService)

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/v1/projects", projectHandler.Create)
	mux.HandleFunc("GET /api/v1/projects", projectHandler.List)
	mux.HandleFunc("POST /api/v1/projects/{projectId}/deployments", deploymentHandler.Create)

	server := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	log.Println("BetterHost API running on :8080")

	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
