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
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (r *Repository) Create(
	ctx context.Context,
	name string,
	slug string,
) (*Project, error) {
	var project Project

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO projects (name, slug)
		VALUES ($1, $2)
		RETURNING id, name, slug, created_at, updated_at
		`,
		name,
		slug,
	).Scan(
		&project.ID,
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

func (r *Repository) FindAll(ctx context.Context) ([]Project, error) {
	rows, err := r.db.Query(
		ctx,
		`
		SELECT id, name, slug, created_at, updated_at
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
		SELECT id, name, slug, created_at, updated_at
		FROM projects
		WHERE LOWER(slug) = LOWER($1)
		`,
		slug,
	).Scan(
		&project.ID,
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
		SELECT id, name, slug, created_at, updated_at
		FROM projects
		WHERE id = $1
		`,
		id,
	).Scan(
		&project.ID,
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
