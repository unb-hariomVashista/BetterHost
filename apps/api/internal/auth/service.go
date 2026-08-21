package auth

import (
	"context"
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo       *Repository
	jwtService *JWTService
}

func NewService(repo *Repository, jwtService *JWTService) *Service {
	return &Service{
		repo:       repo,
		jwtService: jwtService,
	}
}

func (s *Service) Register(ctx context.Context, payload RegisterPayload) (*AuthResponse, error) {
	email := strings.TrimSpace(strings.ToLower(payload.Email))
	if email == "" || payload.Password == "" {
		return nil, errors.New("email and password are required")
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user, err := s.repo.CreateUser(ctx, payload.FirstName, payload.LastName, email, string(hashedBytes))
	if err != nil {
		return nil, err
	}

	token, err := s.jwtService.GenerateToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User:  ToUserResponse(user),
	}, nil
}

func (s *Service) Login(ctx context.Context, payload LoginPayload) (*AuthResponse, error) {
	email := strings.TrimSpace(strings.ToLower(payload.Email))
	if email == "" || payload.Password == "" {
		return nil, errors.New("email and password are required")
	}

	user, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(payload.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	token, err := s.jwtService.GenerateToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User:  ToUserResponse(user),
	}, nil
}

func (s *Service) GetUserFromToken(ctx context.Context, tokenStr string) (*UserResponse, error) {
	claims, err := s.jwtService.ValidateToken(tokenStr)
	if err != nil {
		return nil, err
	}

	user, err := s.repo.FindByID(ctx, claims.UserID)
	if err != nil {
		return nil, err
	}

	res := ToUserResponse(user)
	return &res, nil
}
