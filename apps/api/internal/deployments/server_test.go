package deployments

import (
	"os"
	"path/filepath"
	"testing"
)

func TestNormalizeArtifactPath(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"storage\\deployments\\myproject\\deploy-1", filepath.FromSlash("storage/deployments/myproject/deploy-1")},
		{"storage/deployments/myproject/deploy-1", filepath.FromSlash("storage/deployments/myproject/deploy-1")},
		{"", ""},
	}

	for _, tt := range tests {
		result := normalizeArtifactPath(tt.input)
		if result != tt.expected {
			t.Errorf("normalizeArtifactPath(%q) = %q; want %q", tt.input, result, tt.expected)
		}
	}
}

func TestResolveFilePathWithWindowsBackslashes(t *testing.T) {
	// Setup temporary directory structure
	tmpDir := t.TempDir()
	deployDir := filepath.Join(tmpDir, "storage", "deployments", "testproject", "deploy1")
	if err := os.MkdirAll(deployDir, 0755); err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}

	indexContent := "<html><body>Hello BetterHost</body></html>"
	indexPath := filepath.Join(deployDir, "index.html")
	if err := os.WriteFile(indexPath, []byte(indexContent), 0644); err != nil {
		t.Fatalf("failed to write temp file: %v", err)
	}

	// Simulate database artifactPath containing Windows backslashes
	winArtifactPath := filepath.Join(tmpDir, "storage\\deployments\\testproject\\deploy1")

	targetPath, _, found := resolveFilePath(winArtifactPath, "index.html")
	if !found {
		t.Fatalf("resolveFilePath failed to find index.html with backslash artifactPath: %s", winArtifactPath)
	}

	if targetPath != indexPath {
		t.Errorf("got targetPath = %q; want %q", targetPath, indexPath)
	}
}
