package deployments

import (
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	StatusQueued     Status = "QUEUED"
	StatusBuilding   Status = "BUILDING"
	StatusDeploying  Status = "DEPLOYING"
	StatusReady      Status = "READY"
	StatusFailed     Status = "FAILED"
	StatusTerminated Status = "TERMINATED"
)

type Deployment struct {
	ID           uuid.UUID `json:"id"`
	ProjectID    string    `json:"projectId"`
	Slug         string    `json:"slug"`
	Entrypoint   string    `json:"entrypoint"`
	ArtifactPath string    `json:"artifactPath"`
	Status       Status    `json:"status"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}
