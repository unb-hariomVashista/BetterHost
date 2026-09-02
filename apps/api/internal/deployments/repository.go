package deployments

import (
	"context"
	"os"
	"path/filepath"
	"strings"

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
	_ = r.CleanupStaleDeployments(ctx)
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

func (r *Repository) FindByUserID(ctx context.Context, userID uuid.UUID) ([]DeploymentWithProject, error) {
	_ = r.CleanupStaleDeployments(ctx)
	rows, err := r.db.Query(
		ctx,
		`
		SELECT d.id, d.project_id, d.slug, d.entrypoint, d.artifact_path, d.status, d.created_at, d.updated_at,
		       p.name, p.slug
		FROM deployments d
		JOIN projects p ON p.id = d.project_id
		WHERE p.user_id = $1 OR p.user_id IS NULL
		ORDER BY d.created_at DESC
		`,
		userID,
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

func (r *Repository) CleanupStaleDeployments(ctx context.Context) error {
	_, err := r.db.Exec(
		ctx,
		`
		UPDATE deployments
		SET status = 'FAILED', updated_at = NOW()
		WHERE status IN ('QUEUED', 'DEPLOYING', 'BUILDING')
		  AND updated_at < NOW() - INTERVAL '2 minutes'
		`,
	)
	return err
}

func (r *Repository) FindByID(ctx context.Context, id uuid.UUID) (*Deployment, error) {
	var dep Deployment
	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, project_id, slug, entrypoint, artifact_path, status, created_at, updated_at
		FROM deployments
		WHERE id = $1
		`,
		id,
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

func (r *Repository) FindByProjectSlugAndDeploymentSlug(
	ctx context.Context,
	projectSlug string,
	deploymentSlug string,
) (*Deployment, error) {
	_ = r.CleanupStaleDeployments(ctx)
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

type DeploymentFileRecord struct {
	ID           uuid.UUID
	DeploymentID uuid.UUID
	Path         string
	Content      []byte
	MimeType     string
}

func (r *Repository) SaveDeploymentFile(
	ctx context.Context,
	deploymentID uuid.UUID,
	path string,
	content []byte,
	mimeType string,
) error {
	_, err := r.db.Exec(
		ctx,
		`
		INSERT INTO deployment_files (deployment_id, path, content, mime_type)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (deployment_id, path)
		DO UPDATE SET content = EXCLUDED.content, mime_type = EXCLUDED.mime_type
		`,
		deploymentID,
		path,
		content,
		mimeType,
	)
	return err
}

func (r *Repository) GetDeploymentFilesByDeploymentID(
	ctx context.Context,
	deploymentID uuid.UUID,
) ([]DeploymentFileRecord, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT id, deployment_id, path, content, mime_type
		FROM deployment_files
		WHERE deployment_id = $1
		`,
		deploymentID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []DeploymentFileRecord
	for rows.Next() {
		var f DeploymentFileRecord
		if err := rows.Scan(&f.ID, &f.DeploymentID, &f.Path, &f.Content, &f.MimeType); err != nil {
			return nil, err
		}
		files = append(files, f)
	}

	return files, nil
}

func (r *Repository) RestoreFilesToDisk(
	ctx context.Context,
	deploymentID uuid.UUID,
	targetDir string,
) (int, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT path, content
		FROM deployment_files
		WHERE deployment_id = $1
		`,
		deploymentID,
	)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	restoredCount := 0
	for rows.Next() {
		var relPath string
		var content []byte
		if err := rows.Scan(&relPath, &content); err != nil {
			continue
		}

		filePath := filepath.Join(targetDir, filepath.FromSlash(relPath))
		if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
			continue
		}

		if err := os.WriteFile(filePath, content, 0644); err == nil {
			restoredCount++
		}
	}

	return restoredCount, rows.Err()
}

func (r *Repository) RestoreSingleFileFromDB(
	ctx context.Context,
	deploymentID uuid.UUID,
	relPath string,
	targetDir string,
) (bool, error) {
	cleanRel := filepath.ToSlash(filepath.Clean(relPath))
	cleanRel = strings.TrimPrefix(cleanRel, "/")

	var content []byte
	err := r.db.QueryRow(
		ctx,
		`
		SELECT content
		FROM deployment_files
		WHERE deployment_id = $1 AND (LOWER(path) = LOWER($2) OR LOWER(path) = LOWER($3))
		LIMIT 1
		`,
		deploymentID,
		cleanRel,
		"./"+cleanRel,
	).Scan(&content)

	if err != nil {
		return false, err
	}

	filePath := filepath.Join(targetDir, filepath.FromSlash(cleanRel))
	if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
		return false, err
	}

	if err := os.WriteFile(filePath, content, 0644); err != nil {
		return false, err
	}

	return true, nil
}

