package main

import (
	"context"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/unb-hariomVashista/BetterHost.git/internal/db"
)

func main() {
	_ = godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required in .env or environment")
	}

	ctx := context.Background()
	log.Println("Connecting to Postgres and applying database migrations...")

	pool, err := db.NewPostgresPool(ctx, databaseURL)
	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}
	defer pool.Close()

	log.Println("Database schema migrations applied successfully!")
}
