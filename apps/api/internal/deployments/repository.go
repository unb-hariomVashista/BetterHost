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

type DeploymentWithProject struct {
	Deployment
	ProjectName string `json:"projectName"`
	ProjectSlug string `json:"projectSlug"`
}

func (r *Repository) FindAll(ctx context.Context) ([]DeploymentWithProject, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT d.id, d.project_id, d.slug, d.entrypoint, d.artifact_path, d.status, d.created_at, d.updated_at,
		       p.name, p.slug
		FROM deployments d
		JOIN projects p ON p.id = d.project_id
		ORDER BY d.created_at DESC
		`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var deps []DeploymentWithProject
	for rows.Next() {
		var dep DeploymentWithProject
		if err := rows.Scan(
			&dep.ID,
			&dep.ProjectID,
			&dep.Slug,
			&dep.Entrypoint,
			&dep.ArtifactPath,
			&dep.Status,
			&dep.CreatedAt,
			&dep.UpdatedAt,
			&dep.ProjectName,
			&dep.ProjectSlug,
		); err != nil {
			return nil, err
		}
		deps = append(deps, dep)
	}

	return deps, nil
}

func (r *Repository) FindByProjectID(ctx context.Context, projectID uuid.UUID) ([]Deployment, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT id, project_id, slug, entrypoint, artifact_path, status, created_at, updated_at
		FROM deployments
		WHERE project_id = $1
		ORDER BY created_at DESC
		`,
		projectID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var deps []Deployment

	for rows.Next() {
		var dep Deployment
		if err := rows.Scan(
			&dep.ID,
			&dep.ProjectID,
			&dep.Slug,
			&dep.Entrypoint,
			&dep.ArtifactPath,
			&dep.Status,
			&dep.CreatedAt,
			&dep.UpdatedAt,
		); err != nil {
			return nil, err
		}
		deps = append(deps, dep)
	}

	return deps, nil
}

func (r *Repository) FindByProjectSlugAndDeploymentSlug(
	ctx context.Context,
	projectSlug string,
	deploymentSlug string,
) (*Deployment, error) {
	var dep Deployment

	err := r.db.QueryRow(
		ctx,
		`
		SELECT d.id, d.project_id, d.slug, d.entrypoint, d.artifact_path, d.status, d.created_at, d.updated_at
		FROM deployments d
		JOIN projects p ON p.id = d.project_id
		WHERE LOWER(p.slug) = LOWER($1) AND LOWER(d.slug) = LOWER($2)
		`,
		projectSlug,
		deploymentSlug,
	).Scan(
		&dep.ID,
		&dep.ProjectID,
		&dep.Slug,
		&dep.Entrypoint,
		&dep.ArtifactPath,
		&dep.Status,
		&dep.CreatedAt,
		&dep.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &dep, nil
}

func (r *Repository) UpdateStatus(
	ctx context.Context,
	id uuid.UUID,
	status Status,
	artifactPath string,
	entrypoint string,
) error {
	_, err := r.db.Exec(
		ctx,
		`
		UPDATE deployments
		SET status = $1, artifact_path = $2, entrypoint = $3, updated_at = NOW()
		WHERE id = $4
		`,
		status,
		artifactPath,
		entrypoint,
		id,
	)
	return err
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM deployments WHERE id = $1`, id)
	return err
}
