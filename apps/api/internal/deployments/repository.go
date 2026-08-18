package deployments

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{
		db: db,
	}
}

func (r *Repository) Create(
	ctx context.Context,
	projectID uuid.UUID,
	slug string,
	entrypoint string,
	artifactPath string,
) (*Deployment, error) {
	var deployment Deployment

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO deployments (
			project_id,
			slug,
			entrypoint,
			artifact_path
		)
		VALUES ($1, $2, $3, $4)
		RETURNING
			id,
			project_id,
			slug,
			entrypoint,
			artifact_path,
			status,
			created_at,
			updated_at
		`,
		projectID,
		slug,
		entrypoint,
		artifactPath,
	).Scan(
		&deployment.ID,
		&deployment.ProjectID,
		&deployment.Slug,
		&deployment.Entrypoint,
		&deployment.ArtifactPath,
		&deployment.Status,
		&deployment.CreatedAt,
		&deployment.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &deployment, nil
}
