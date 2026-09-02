package projects

import (
	"context"
	"time"

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

type Project struct {
	ID        uuid.UUID  `json:"id"`
	UserID    *uuid.UUID `json:"userId,omitempty"`
	Name      string     `json:"name"`
	Slug      string     `json:"slug"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

func (r *Repository) Create(
	ctx context.Context,
	userID uuid.UUID,
	name string,
	slug string,
) (*Project, error) {
	var project Project

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO projects (user_id, name, slug)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, name, slug, created_at, updated_at
		`,
		userID,
		name,
		slug,
	).Scan(
		&project.ID,
		&project.UserID,
		&project.Name,
		&project.Slug,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &project, nil
}

func (r *Repository) FindByUserID(ctx context.Context, userID uuid.UUID) ([]Project, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT id, user_id, name, slug, created_at, updated_at
		FROM projects
		WHERE user_id = $1 OR user_id IS NULL
		ORDER BY created_at DESC
		`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []Project

	for rows.Next() {
		var project Project

		if err := rows.Scan(
			&project.ID,
			&project.UserID,
			&project.Name,
			&project.Slug,
			&project.CreatedAt,
			&project.UpdatedAt,
		); err != nil {
			return nil, err
		}

		projects = append(projects, project)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return projects, nil
}

func (r *Repository) FindAll(ctx context.Context) ([]Project, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT id, user_id, name, slug, created_at, updated_at
		FROM projects
		ORDER BY created_at DESC
		`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []Project

	for rows.Next() {
		var project Project

		if err := rows.Scan(
			&project.ID,
			&project.UserID,
			&project.Name,
			&project.Slug,
			&project.CreatedAt,
			&project.UpdatedAt,
		); err != nil {
			return nil, err
		}

		projects = append(projects, project)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return projects, nil
}

func (r *Repository) FindBySlug(ctx context.Context, slug string) (*Project, error) {
	var project Project

	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, user_id, name, slug, created_at, updated_at
		FROM projects
		WHERE LOWER(slug) = LOWER($1)
		`,
		slug,
	).Scan(
		&project.ID,
		&project.UserID,
		&project.Name,
		&project.Slug,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &project, nil
}

func (r *Repository) FindByID(ctx context.Context, id uuid.UUID) (*Project, error) {
	var project Project

	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, user_id, name, slug, created_at, updated_at
		FROM projects
		WHERE id = $1
		`,
		id,
	).Scan(
		&project.ID,
		&project.UserID,
		&project.Name,
		&project.Slug,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &project, nil
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM projects WHERE id = $1`, id)
	return err
}

func (r *Repository) DeleteForUser(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM projects WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)`, id, userID)
	return err
}
