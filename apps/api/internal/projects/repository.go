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
	ID        uuid.UUID
	Name      string
	Slug      string
	CreatedAt time.Time
	UpdatedAt time.Time
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
