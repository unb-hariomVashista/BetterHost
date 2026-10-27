package deployments

import (
	"archive/zip"
	"os"
	"path/filepath"
	"testing"
)

func TestInspectZipForBuildFrameworks(t *testing.T) {
	// Create a temp zip with next.config.js
	tmpDir := t.TempDir()
	nextZipPath := filepath.Join(tmpDir, "next-project.zip")

	f, err := os.Create(nextZipPath)
	if err != nil {
		t.Fatalf("failed to create zip file: %v", err)
	}
	zw := zip.NewWriter(f)
	w, err := zw.Create("next.config.js")
	if err != nil {
		t.Fatalf("failed to add file to zip: %v", err)
	}
	w.Write([]byte("module.exports = {}"))
	zw.Close()
	f.Close()

	err = InspectZipForBuildFrameworks(nextZipPath)
	if err == nil {
		t.Fatalf("expected error for Next.js project zip, got nil")
	}

	// Create a valid static zip with index.html
	staticZipPath := filepath.Join(tmpDir, "static-site.zip")
	f2, err := os.Create(staticZipPath)
	if err != nil {
		t.Fatalf("failed to create static zip file: %v", err)
	}
	zw2 := zip.NewWriter(f2)
	w2, err := zw2.Create("index.html")
	if err != nil {
		t.Fatalf("failed to add index.html to zip: %v", err)
	}
	w2.Write([]byte("<html><body>Hello</body></html>"))
	zw2.Close()
	f2.Close()

	err = InspectZipForBuildFrameworks(staticZipPath)
	if err != nil {
		t.Fatalf("expected valid static zip to pass, got: %v", err)
	}
}

