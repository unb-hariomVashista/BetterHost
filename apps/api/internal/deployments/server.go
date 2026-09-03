package deployments

import (
	"context"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/unb-hariomVashista/BetterHost.git/internal/projects"
)

type Server struct {
	deploymentService *Service
	projectService    *projects.Service
}

func NewServer(deploymentService *Service, projectService *projects.Service) *Server {
	return &Server{
		deploymentService: deploymentService,
		projectService:    projectService,
	}
}

const projectOverviewTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{ .Project.Name }} - BetterHost Deployments</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 font-sans p-8">
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
      <div>
        <h1 class="text-3xl font-extrabold text-slate-900">{{ .Project.Name }}</h1>
        <p class="text-sm text-slate-500 font-mono mt-1">/projects/{{ .Project.Slug }}</p>
      </div>
      <a href="/dashboard" class="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
        &larr; Back to Dashboard
      </a>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
      <h2 class="text-xl font-bold text-slate-900 mb-4">Deployments for {{ .Project.Name }}</h2>
      {{ if .Deployments }}
        <div class="divide-y divide-slate-100">
          {{ range .Deployments }}
            <div class="py-4 flex items-center justify-between">
              <div>
                <a href="/projects/{{ $.Project.Slug }}/{{ .Slug }}/" class="text-base font-bold text-indigo-600 hover:underline">
                  /projects/{{ $.Project.Slug }}/{{ .Slug }}
                </a>
                <div class="text-xs text-slate-400 font-mono mt-0.5">Status: <span class="font-bold text-emerald-600">{{ .Status }}</span></div>
              </div>
              <a href="/projects/{{ $.Project.Slug }}/{{ .Slug }}/" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700">
                View Site &rarr;
              </a>
            </div>
          {{ end }}
        </div>
      {{ else }}
        <p class="text-sm text-slate-400">No deployments yet for this project. Upload a zip file from your Dashboard.</p>
      {{ end }}
    </div>
  </div>
</body>
</html>`

var (
	phpTagRegex      = regexp.MustCompile(`(?s)<\?php.*?\?>`)
	phpShortTagRegex = regexp.MustCompile(`(?s)<\?=.*?\?>`)
)

func normalizeArtifactPath(pathStr string) string {
	if pathStr == "" {
		return ""
	}
	clean := strings.ReplaceAll(pathStr, "\\", "/")
	hostPath := filepath.FromSlash(clean)

	if filepath.IsAbs(hostPath) {
		return hostPath
	}
	if _, err := os.Stat(hostPath); err == nil {
		return hostPath
	}

	if storageDir := os.Getenv("STORAGE_DIR"); storageDir != "" {
		relStorage := strings.TrimPrefix(clean, "storage/")
		alt := filepath.Join(storageDir, filepath.FromSlash(relStorage))
		if _, err := os.Stat(alt); err == nil {
			return alt
		}
	}

	if execPath, err := os.Executable(); err == nil {
		execDir := filepath.Dir(execPath)
		alt := filepath.Join(execDir, hostPath)
		if _, err := os.Stat(alt); err == nil {
			return alt
		}
	}

	return hostPath
}

func resolveIndexFile(dir string) (string, os.FileInfo, bool) {
	dir = normalizeArtifactPath(dir)
	candidates := []string{"index.html", "index.php", "index.htm", "default.html"}
	for _, c := range candidates {
		p := filepath.Join(dir, c)
		if fi, err := os.Stat(p); err == nil {
			return p, fi, true
		}
	}
	return "", nil, false
}

func resolveFilePath(artifactPath, subpath string) (string, os.FileInfo, bool) {
	artifactPath = normalizeArtifactPath(artifactPath)
	subpath = strings.ReplaceAll(subpath, "\\", "/")
	subpath = filepath.Clean(subpath)

	// 1. Direct check
	targetPath := filepath.Join(artifactPath, subpath)
	if fi, err := os.Stat(targetPath); err == nil {
		if fi.IsDir() {
			if idxPath, idxFi, found := resolveIndexFile(targetPath); found {
				return idxPath, idxFi, true
			}
		} else {
			return targetPath, fi, true
		}
	}

	// 2. Single top-level directory wrapper check (e.g. artifactPath/CBC/subpath)
	entries, readErr := os.ReadDir(artifactPath)
	if readErr == nil && len(entries) == 1 && entries[0].IsDir() {
		wrapperDir := filepath.Join(artifactPath, entries[0].Name())
		targetPath = filepath.Join(wrapperDir, subpath)
		if fi, err := os.Stat(targetPath); err == nil {
			if fi.IsDir() {
				if idxPath, idxFi, found := resolveIndexFile(targetPath); found {
					return idxPath, idxFi, true
				}
			} else {
				return targetPath, fi, true
			}
		}
	}

	// 3. Case-insensitive & flexible path fallback check
	searchDirs := []string{artifactPath}
	if readErr == nil && len(entries) == 1 && entries[0].IsDir() {
		searchDirs = append(searchDirs, filepath.Join(artifactPath, entries[0].Name()))
	}

	for _, sDir := range searchDirs {
		parts := strings.Split(filepath.ToSlash(subpath), "/")
		curr := sDir
		match := true

		for _, part := range parts {
			if part == "" || part == "." {
				continue
			}
			dirEntries, err := os.ReadDir(curr)
			if err != nil {
				match = false
				break
			}

			matchedPart := ""
			for _, de := range dirEntries {
				if strings.EqualFold(de.Name(), part) {
					matchedPart = de.Name()
					break
				}
			}

			if matchedPart == "" {
				match = false
				break
			}
			curr = filepath.Join(curr, matchedPart)
		}

		if match {
			if fi, err := os.Stat(curr); err == nil {
				if fi.IsDir() {
					if idxPath, idxFi, found := resolveIndexFile(curr); found {
						return idxPath, idxFi, true
					}
				} else {
					return curr, fi, true
				}
			}
		}
	}

	// 4. Recursive filename fallback search if target asset is not found
	fileName := filepath.Base(subpath)
	if fileName != "." && fileName != "" {
		var foundPath string
		_ = filepath.WalkDir(artifactPath, func(p string, d os.DirEntry, err error) error {
			if err != nil || foundPath != "" {
				return nil
			}
			if !d.IsDir() && strings.EqualFold(d.Name(), fileName) {
				foundPath = p
			}
			return nil
		})
		if foundPath != "" {
			if fi, err := os.Stat(foundPath); err == nil {
				return foundPath, fi, true
			}
		}
	}

	return "", nil, false
}

func (s *Server) restoreDeploymentFilesFromDB(ctx context.Context, dep *Deployment) bool {
	targetDir := normalizeArtifactPath(dep.ArtifactPath)
	if targetDir == "" {
		targetDir = filepath.Join(getStorageDir(), "deployments", strings.ToLower(dep.Slug))
	}

	restoredCount, err := s.deploymentService.repository.RestoreFilesToDisk(ctx, dep.ID, targetDir)
	if err != nil || restoredCount == 0 {
		return false
	}

	log.Printf("[Self-Healing Storage] Restored %d files from PostgreSQL database for deployment %s to %s", restoredCount, dep.Slug, targetDir)
	return true
}

func (s *Server) ServeProjectOrDeployment(w http.ResponseWriter, r *http.Request) {
	// Path pattern: /projects/{projectSlug} or /projects/{projectSlug}/{deploymentSlug} or /projects/{projectSlug}/{deploymentSlug}/*
	rawPath := strings.TrimPrefix(r.URL.Path, "/projects/")
	rawPath = strings.TrimPrefix(rawPath, "/")
	parts := strings.Split(rawPath, "/")

	if len(parts) == 0 || parts[0] == "" {
		http.Error(w, "project slug is required", http.StatusBadRequest)
		return
	}

	projectSlug := parts[0]

	// Case 1: GET /projects/{projectSlug} (Project Overview Page)
	if len(parts) == 1 || (len(parts) == 2 && parts[1] == "") {
		proj, err := s.projectService.GetProjectBySlug(r.Context(), projectSlug)
		if err != nil || proj == nil {
			http.Error(w, fmt.Sprintf("project '%s' not found", projectSlug), http.StatusNotFound)
			return
		}

		deps, err := s.deploymentService.ListDeploymentsByProjectID(r.Context(), proj.ID)
		if err != nil {
			deps = []Deployment{}
		}

		if strings.Contains(r.Header.Get("Accept"), "application/json") {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{
				"project":     proj,
				"deployments": deps,
			})
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		tmpl, _ := template.New("overview").Parse(projectOverviewTemplate)
		tmpl.Execute(w, map[string]any{
			"Project":     proj,
			"Deployments": deps,
		})
		return
	}

	// Case 2: GET /projects/{projectSlug}/{deploymentSlug}...
	deploymentSlug := parts[1]

	dep, err := s.deploymentService.GetDeploymentBySlugs(r.Context(), projectSlug, deploymentSlug)

	subpath := ""
	if err == nil && dep != nil {
		subpath = strings.Join(parts[2:], "/")
	} else {
		// Fallback: If parts[1] is NOT a deployment slug, it's an asset path (e.g. /projects/test-project/Javascripts/modal.js)
		// Fetch the latest READY deployment for this project!
		proj, projErr := s.projectService.GetProjectBySlug(r.Context(), projectSlug)
		if projErr == nil && proj != nil {
			deps, _ := s.deploymentService.ListDeploymentsByProjectID(r.Context(), proj.ID)
			for _, d := range deps {
				if d.Status == StatusReady {
					dep = &d
					subpath = strings.Join(parts[1:], "/")
					break
				}
			}
		}
	}

	if dep == nil {
		http.Error(w, fmt.Sprintf("deployment or asset not found for project '%s'", projectSlug), http.StatusNotFound)
		return
	}

	if dep.Status != StatusReady {
		http.Error(w, fmt.Sprintf("deployment '%s' status is %s (not ready)", dep.Slug, dep.Status), http.StatusServiceUnavailable)
		return
	}

	if subpath == "" || subpath == "/" {
		// Check for index file inside deployment artifactPath
		if idxPath, _, found := resolveIndexFile(dep.ArtifactPath); found {
			rel, _ := filepath.Rel(dep.ArtifactPath, idxPath)
			subpath = rel
		} else {
			subpath = "index.html"
		}
	}

	targetFilePath, _, found := resolveFilePath(dep.ArtifactPath, subpath)
	if !found {
		targetDir := normalizeArtifactPath(dep.ArtifactPath)
		if targetDir == "" {
			targetDir = filepath.Join(getStorageDir(), "deployments", strings.ToLower(dep.Slug))
		}
		if restored, _ := s.deploymentService.repository.RestoreSingleFileFromDB(r.Context(), dep.ID, subpath, targetDir); restored {
			targetFilePath, _, found = resolveFilePath(dep.ArtifactPath, subpath)
		}
	}
	if !found {
		if s.restoreDeploymentFilesFromDB(r.Context(), dep) {
			targetFilePath, _, found = resolveFilePath(dep.ArtifactPath, subpath)
		}
	}

	if !found {
		normPath := normalizeArtifactPath(dep.ArtifactPath)
		log.Printf("[ServeProjectOrDeployment] File not found: subpath=%q, DB artifactPath=%q, normalizedPath=%q", subpath, dep.ArtifactPath, normPath)
		http.Error(w, "file not found", http.StatusNotFound)
		return
	}

	ext := strings.ToLower(filepath.Ext(targetFilePath))

	// Strip PHP script tags for static previews and inject base tag for relative asset resolution
	if ext == ".php" || ext == ".html" || ext == ".htm" {
		contentBytes, readErr := os.ReadFile(targetFilePath)
		if readErr == nil {
			htmlStr := string(contentBytes)
			if strings.Contains(htmlStr, "<?php") || strings.Contains(htmlStr, "<?=") {
				htmlStr = string(phpTagRegex.ReplaceAll([]byte(htmlStr), nil))
				htmlStr = string(phpShortTagRegex.ReplaceAll([]byte(htmlStr), nil))
			}

			// Inject base tag for relative asset resolution if not present
			if !strings.Contains(strings.ToLower(htmlStr), "<base ") {
				baseHref := fmt.Sprintf(`<base href="/projects/%s/%s/">`, projectSlug, dep.Slug)
				if idx := strings.Index(strings.ToLower(htmlStr), "<head>"); idx != -1 {
					htmlStr = htmlStr[:idx+6] + "\n  " + baseHref + htmlStr[idx+6:]
				} else if idx := strings.Index(strings.ToLower(htmlStr), "<head "); idx != -1 {
					closeHeadIdx := strings.Index(htmlStr[idx:], ">")
					if closeHeadIdx != -1 {
						insertPos := idx + closeHeadIdx + 1
						htmlStr = htmlStr[:insertPos] + "\n  " + baseHref + htmlStr[insertPos:]
					}
				} else if idx := strings.Index(strings.ToLower(htmlStr), "<html>"); idx != -1 {
					htmlStr = htmlStr[:idx+6] + "\n<head>" + baseHref + "</head>" + htmlStr[idx+6:]
				}
			}

			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-cache, must-revalidate")
			w.Write([]byte(htmlStr))
			return
		}
	}

	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		switch ext {
		case ".html", ".htm", ".php":
			contentType = "text/html; charset=utf-8"
		case ".css":
			contentType = "text/css; charset=utf-8"
		case ".js", ".mjs":
			contentType = "application/javascript; charset=utf-8"
		case ".svg":
			contentType = "image/svg+xml"
		case ".png":
			contentType = "image/png"
		case ".jpg", ".jpeg":
			contentType = "image/jpeg"
		case ".webp":
			contentType = "image/webp"
		case ".gif":
			contentType = "image/gif"
		case ".json":
			contentType = "application/json"
		case ".woff":
			contentType = "font/woff"
		case ".woff2":
			contentType = "font/woff2"
		case ".ttf":
			contentType = "font/ttf"
		default:
			contentType = "application/octet-stream"
		}
	}

	if ext == ".html" || ext == ".htm" || ext == ".php" {
		w.Header().Set("Cache-Control", "no-cache, must-revalidate")
	} else {
		w.Header().Set("Cache-Control", "public, max-age=86400")
	}

	w.Header().Set("Content-Type", contentType)
	http.ServeFile(w, r, targetFilePath)
}
