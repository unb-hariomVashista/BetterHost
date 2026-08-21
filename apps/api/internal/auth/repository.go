package auth

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

func (r *Repository) CreateUser(
	ctx context.Context,
	firstName string,
	lastName string,
	email string,
	passwordHash string,
) (*User, error) {
	var user User

	err := r.db.QueryRow(
		ctx,
		`
		INSERT INTO users (first_name, last_name, email, password_hash)
		VALUES ($1, $2, LOWER($3), $4)
		RETURNING id, first_name, last_name, email, password_hash, created_at, updated_at
		`,
		firstName,
		lastName,
		email,
		passwordHash,
	).Scan(
		&user.ID,
		&user.FirstName,
		&user.LastName,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) FindByEmail(ctx context.Context, email string) (*User, error) {
	var user User

	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, first_name, last_name, email, password_hash, created_at, updated_at
		FROM users
		WHERE LOWER(email) = LOWER($1)
		`,
		email,
	).Scan(
		&user.ID,
		&user.FirstName,
		&user.LastName,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) FindByID(ctx context.Context, id uuid.UUID) (*User, error) {
	var user User

	err := r.db.QueryRow(
		ctx,
		`
		SELECT id, first_name, last_name, email, password_hash, created_at, updated_at
		FROM users
		WHERE id = $1
		`,
		id,
	).Scan(
		&user.ID,
		&user.FirstName,
		&user.LastName,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}
