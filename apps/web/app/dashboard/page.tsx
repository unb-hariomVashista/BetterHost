"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  LayoutGrid,
  Folder,
  Zap,
  BookOpen,
  FileText,
  HelpCircle,
  Search,
  Bell,
  Plus,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Upload,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  FolderArchive,
  RotateCcw,
  Download,
  Maximize2,
  Code2,
  Rocket,
  Globe,
  Activity,
  List,
  Trash2,
  LogOut,
} from "lucide-react";
import {
  createProject,
  getProjects,
  getProjectDeployments,
  deleteProject,
  deleteDeployment,
  redeployDeployment,
  getCurrentUser,
  API_BASE_URL,
  Project,
  Deployment,
  UserResponse,
} from "@/lib/api";
import ZipPreviewModal from "@/app/components/ZipPreviewModal";

function normalizeProject(p: any): Project {
  return {
    id: p?.id || p?.ID || Math.random().toString(),
    name: p?.name || p?.Name || "Untitled Project",
    slug: p?.slug || p?.Slug || "project",
    createdAt: p?.createdAt || p?.CreatedAt || new Date().toISOString(),
    updatedAt: p?.updatedAt || p?.UpdatedAt || new Date().toISOString(),
  };
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allDeployments, setAllDeployments] = useState<
    { project: Project; deployment: Deployment }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectName, setProjectName] = useState("");

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectForUpload, setSelectedProjectForUpload] =
    useState<Project | null>(null);

  const [isProjectsDropdownOpen, setIsProjectsDropdownOpen] = useState(true);
  const [openActionDropdownId, setOpenActionDropdownId] = useState<string | null>(null);

  const [projectsLayout, setProjectsLayout] = useState<"table" | "grid">("table");
  const [environmentFilter, setEnvironmentFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Latest");

  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [activeNav, setActiveNav] = useState<"dashboard" | "projects" | "deployments">("dashboard");

  const [selectedDeploymentIndex, setSelectedDeploymentIndex] = useState<number>(0);

  const handleLogout = () => {
    localStorage.removeItem("betterhost_token");
    localStorage.removeItem("betterhost_user");
    window.location.href = "/login";
  };

  // Load user profile & projects on mount
  useEffect(() => {
    const token = localStorage.getItem("betterhost_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const savedUser = localStorage.getItem("betterhost_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }

    getCurrentUser(token)
      .then((u) => {
        if (u) {
          setUser(u);
          localStorage.setItem("betterhost_user", JSON.stringify(u));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch current user", err);
        localStorage.removeItem("betterhost_token");
        localStorage.removeItem("betterhost_user");
        window.location.href = "/login";
      });

    fetchProjects();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const hasPending = allDeployments.some(
      (item) =>
        item.deployment.status === "QUEUED" ||
        item.deployment.status === "DEPLOYING" ||
        item.deployment.status === "BUILDING"
    );

    if (hasPending) {
      interval = setInterval(() => {
        fetchProjects(false);
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [allDeployments]);

  const fetchProjects = async (showSpinner = true) => {
    if (showSpinner) setLoadingProjects(true);
    try {
      const data = await getProjects();
      const normalized = (data || []).map(normalizeProject);
      setProjects(normalized);

      // Fetch all deployments across projects
      const combinedDeps: { project: Project; deployment: Deployment }[] = [];
      for (const p of normalized) {
        try {
          const deps = await getProjectDeployments(p.id);
          (deps || []).forEach((d) => {
            combinedDeps.push({ project: p, deployment: d });
          });
        } catch (e) {
          // ignore
        }
      }
      setAllDeployments(combinedDeps);
    } catch (err: any) {
      console.error("Error fetching projects:", err);
    } finally {
      if (showSpinner) setLoadingProjects(false);
    }
  };

  const handleRedeployDeployment = async (deploymentId: string) => {
    try {
      await redeployDeployment(deploymentId);
      await fetchProjects(false);
    } catch (err: any) {
      alert(err.message || "Failed to redeploy deployment");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setError(null);
    setCreating(true);

    try {
      const newProjRaw = await createProject(projectName.trim());
      const newProj = normalizeProject(newProjRaw);
      setProjects((prev) => [newProj, ...prev]);
      setProjectName("");
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? All associated deployments will be deleted.")) return;
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setAllDeployments((prev) => prev.filter((d) => d.project.id !== projectId));
      setOpenActionDropdownId(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete project");
    }
  };

  const handleDeleteDeployment = async (deploymentId: string) => {
    if (!confirm("Are you sure you want to delete this deployment?")) return;
    try {
      await deleteDeployment(deploymentId);
      setAllDeployments((prev) => prev.filter((d) => d.deployment.id !== deploymentId));
      setSelectedDeploymentIndex(0);
      setOpenActionDropdownId(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete deployment");
    }
  };



  // Generate slug preview from input
  const slugPreview = projectName.trim()
    ? projectName.trim().toLowerCase().replace(/\s+/g, "-")
    : "my-awesome-project";

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Derive user display name & initials from actual DB user
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.email || "User";

  const firstNameOnly = user?.firstName || user?.email?.split("@")[0] || "User";

  const userInitials = user?.firstName
    ? `${user.firstName.charAt(0)}${
        user.lastName ? user.lastName.charAt(0) : ""
      }`.toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "U";

  const userEmail = user?.email || "";

  // Helper to pick letter badge color
  const getBadgeColor = (index: number) => {
    const colors = [
      "bg-slate-900 text-white",
      "bg-indigo-600 text-white",
      "bg-blue-600 text-white",
      "bg-violet-600 text-white",
      "bg-purple-600 text-white",
      "bg-emerald-600 text-white",
    ];
    return colors[index % colors.length];
  };

  const openZipUploadModal = (p: Project) => {
    setSelectedProjectForUpload(p);
    setOpenActionDropdownId(null);
  };

  // Current Active Deployment item for the Detail View
  const activeDepItem = allDeployments[selectedDeploymentIndex] || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row">
      {/* ================= SHADCN-STYLE SIDEBAR ================= */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 select-none">
        {/* Header Branding */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="BetterHost Logo"
              width={150}
              height={38}
              className="h-8 w-auto object-contain"
              priority
            />
          </a>
        </div>

        {/* Shadcn Navigation Items */}
        <div className="flex-1 px-3 py-4 flex flex-col justify-between overflow-y-auto">
          <div className="flex flex-col gap-1">
            <div className="px-2 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Platform
            </div>

            {/* Nav 1: Dashboard */}
            <button
              onClick={() => setActiveNav("dashboard")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeNav === "dashboard"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Dashboard</span>
            </button>

            {/* Nav 2: Projects Dropdown Menu */}
            <div className="flex flex-col">
              <button
                onClick={() => {
                  setActiveNav("projects");
                  setIsProjectsDropdownOpen(!isProjectsDropdownOpen);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeNav === "projects"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Folder className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>Projects</span>
                </div>
                {isProjectsDropdownOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {/* Projects Collapsible Sub-List */}
              {isProjectsDropdownOpen && (
                <div className="ml-4 pl-3 border-l border-slate-200/60 my-1 flex flex-col gap-0.5">
                  {projects.length === 0 ? (
                    <span className="px-2 py-1.5 text-[11px] text-slate-400 italic">
                      No projects created
                    </span>
                  ) : (
                    projects.map((p) => (
                      <a
                        key={p.id}
                        href={`/projects/${p.slug}`}
                        className="px-2 py-1.5 rounded-md text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 font-medium truncate flex items-center justify-between group transition-colors"
                      >
                        <span className="truncate">{p.name}</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
                      </a>
                    ))
                  )}

                  {/* Quick Action: + Create Project */}
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-2 py-1.5 text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1 mt-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create Project</span>
                  </button>
                </div>
              )}
            </div>

            {/* Nav 3: Deployments */}
            <button
              onClick={() => setActiveNav("deployments")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeNav === "deployments"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Zap className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Deployments</span>
            </button>
          </div>

          {/* Secondary Links & User Profile Footer */}
          <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col gap-0.5">
              <a
                href="/#changelog"
                className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Changelog</span>
              </a>
              <a
                href="/#support"
                className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>Support</span>
              </a>
            </div>

            {/* User Profile Footer */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                  {userInitials}
                </div>
                <div className="flex flex-col truncate text-left">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {userName}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    {userEmail}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-100 bg-white px-6 flex items-center justify-between shrink-0">
          {/* Breadcrumbs or Global Search Bar */}
          {activeNav === "deployments" && activeDepItem ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <button
                onClick={() => setActiveNav("deployments")}
                className="text-indigo-600 hover:underline"
              >
                Deployments
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 font-bold">
                Deployment #{activeDepItem.deployment.slug}
              </span>
            </div>
          ) : (
            <div className="relative w-full max-w-md flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                placeholder="Search projects, deployments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-2 bg-slate-50/70 border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
              <div className="absolute right-3 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-semibold text-slate-400">
                ⌘ K
              </div>
            </div>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-5">
            <button className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer relative">
              <Bell className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 cursor-pointer select-none">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[11px]">
                {userInitials}
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                {userName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Dashboard Dynamic Workspace Tabs */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl w-full mx-auto flex flex-col gap-8">
          {/* ================= TAB 1: DASHBOARD OVERVIEW ================= */}
          {activeNav === "dashboard" && (
            <>
              {/* Greeting & Top CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                    Welcome back, {firstNameOnly}!
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">
                    Deploy your projects and get them live in seconds.
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer w-fit"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </button>
              </div>

              {/* 2 Summary Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {/* Card 1: Projects */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Folder className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      Projects
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {projects.length}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>
                        {projects.length > 0
                          ? `${projects.length} active`
                          : "0 active"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Deployments */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      Deployments
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {allDeployments.length}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>
                        {allDeployments.filter((d) => d.deployment.status === "READY").length} successful
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid: Left Column (Your Projects) & Right Column (Recent Activity) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
                {/* Left Column (Span 2) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  {/* Table Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-slate-900">
                        Your Projects
                      </h3>
                      <button
                        onClick={() => setActiveNav("projects")}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-3 py-1 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        View all
                      </button>
                    </div>

                    {loadingProjects ? (
                      <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        <span>Loading projects...</span>
                      </div>
                    ) : filteredProjects.length === 0 ? (
                      <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                        <Folder className="w-8 h-8 text-slate-300" />
                        <span className="text-xs font-medium">No projects created yet.</span>
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="mt-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                        >
                          + Create First Project
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col divide-y divide-slate-100">
                        {filteredProjects.map((proj, idx) => {
                          const initial = proj.name
                            ? proj.name.charAt(0).toUpperCase()
                            : "P";
                          return (
                            <div
                              key={proj.id}
                              className="py-4 first:pt-2 last:pb-2 flex items-center justify-between gap-4 group"
                            >
                              <div className="flex items-center gap-3.5 truncate">
                                <div
                                  className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 shadow-xs ${getBadgeColor(
                                    idx
                                  )}`}
                                >
                                  {initial}
                                </div>
                                <div className="flex flex-col truncate">
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={`/projects/${proj.slug}`}
                                      className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors truncate"
                                    >
                                      {proj.name}
                                    </a>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                  </div>
                                  <a
                                    href={`/projects/${proj.slug}`}
                                    className="text-xs text-slate-400 hover:text-indigo-600 font-mono flex items-center gap-1 transition-colors truncate"
                                  >
                                    <span>/projects/{proj.slug}</span>
                                    <ExternalLink className="w-3 h-3 opacity-70" />
                                  </a>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 shrink-0 relative">
                                <div className="hidden sm:flex flex-col text-right">
                                  <span className="text-xs font-medium text-slate-500">
                                    Production
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(proj.createdAt).toLocaleDateString()}
                                  </span>
                                </div>

                                {/* Three Dot Action Dropdown */}
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      setOpenActionDropdownId(
                                        openActionDropdownId === proj.id ? null : proj.id
                                      )
                                    }
                                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {openActionDropdownId === proj.id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-30 flex flex-col gap-1 text-xs">
                                      <button
                                        onClick={() => openZipUploadModal(proj)}
                                        className="w-full px-3 py-2 rounded-lg text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                                      >
                                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Deploy Zip</span>
                                      </button>
                                      <a
                                        href={`/projects/${proj.slug}`}
                                        className="w-full px-3 py-2 rounded-lg text-left text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 transition-colors"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                        <span>View Details</span>
                                      </a>
                                      <button
                                        onClick={() => handleDeleteProject(proj.id)}
                                        className="w-full px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-100 mt-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                        <span>Delete Project</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Dashed "+ New Project" Card Trigger */}
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-indigo-300 bg-white/50 hover:bg-indigo-50/30 rounded-2xl p-8 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm group-hover:scale-105 transition-transform">
                      <Plus className="w-4 h-4" />
                      <span>New Project</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Deploy a new project in minutes.
                    </span>
                  </button>
                </div>

                {/* Right Column (Span 1) */}
                <div className="flex flex-col gap-6">
                  {/* Recent Activity Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-slate-900">
                        Recent Activity
                      </h3>
                      {allDeployments.length > 0 && (
                        <button
                          onClick={() => setActiveNav("deployments")}
                          className="text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          View all
                        </button>
                      )}
                    </div>

                    {allDeployments.length === 0 ? (
                      <div className="py-8 text-center flex flex-col items-center gap-2 text-slate-400 text-xs">
                        <Activity className="w-6 h-6 text-slate-300" />
                        <span>No recent deployment activity yet.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 text-xs">
                        {allDeployments.slice(0, 5).map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                {item.deployment.status === "READY" ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                                )}
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="font-semibold text-slate-800">
                                  Deployment #{item.deployment.slug} {item.deployment.status === "READY" ? "succeeded" : "queued"}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {item.project.slug}
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {new Date(item.deployment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ================= TAB 2: PROJECTS MANAGEMENT (MATCHING DESIGN MOCKUP) ================= */}
          {activeNav === "projects" && (
            <div className="flex flex-col gap-8 text-left">
              {/* Header Title & CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                    Projects
                  </h1>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">
                    All your projects in one place. Deploy and manage them effortlessly.
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer w-fit"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                </button>
              </div>

              {/* Search, Filter & Layout Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search projects input */}
                  <div className="relative w-64 flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Environment Filter Dropdown */}
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 cursor-pointer">
                    <span className="text-slate-400">Environment</span>
                    <select
                      value={environmentFilter}
                      onChange={(e) => setEnvironmentFilter(e.target.value)}
                      className="appearance-none bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="All">All</option>
                      <option value="Production">Production</option>
                      <option value="Staging">Staging</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>

                  {/* Sort By Filter Dropdown */}
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 cursor-pointer">
                    <span className="text-slate-400">Sort by</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="Latest">Latest</option>
                      <option value="Name">Name</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                </div>

                {/* View Layout Toggle Buttons */}
                <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-white shrink-0">
                  <button
                    onClick={() => setProjectsLayout("table")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      projectsLayout === "table"
                        ? "bg-indigo-50 text-indigo-600 font-bold"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setProjectsLayout("grid")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      projectsLayout === "grid"
                        ? "bg-indigo-50 text-indigo-600 font-bold"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Projects Workspace Content */}
              {loadingProjects ? (
                <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2 bg-white rounded-2xl border border-slate-100">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Loading projects workspace...</span>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="p-16 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 flex flex-col items-center justify-center gap-3">
                  <Folder className="w-10 h-10 text-slate-300" />
                  <span className="font-bold text-slate-700 text-sm">No projects found</span>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Get started by creating your first project to deploy static sites.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                  >
                    + Create First Project
                  </button>
                </div>
              ) : projectsLayout === "table" ? (
                /* Projects Table View (Matching Design Mockup) */
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col overflow-hidden">
                  <div className="overflow-x-auto min-h-[260px] pb-16">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                          <th className="py-3.5 px-6">Project</th>
                          <th className="py-3.5 px-6">Environment</th>
                          <th className="py-3.5 px-6">Last Deployment</th>
                          <th className="py-3.5 px-6">Status</th>
                          <th className="py-3.5 px-6 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {filteredProjects.map((p, idx) => {
                          const initial = p.name ? p.name.charAt(0).toUpperCase() : "P";
                          const projectDeps = allDeployments.filter((d) => d.project.id === p.id);
                          const lastDep = projectDeps[0];

                          return (
                            <tr
                              key={p.id}
                              className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                            >
                              {/* Project Name & Subtitle Link */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3.5 truncate">
                                  <div
                                    className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 shadow-xs ${getBadgeColor(
                                      idx
                                    )}`}
                                  >
                                    {initial}
                                  </div>
                                  <div className="flex flex-col truncate">
                                    <a
                                      href={`/projects/${p.slug}`}
                                      className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate"
                                    >
                                      {p.name}
                                    </a>
                                    <a
                                      href={`/projects/${p.slug}`}
                                      className="text-xs text-slate-400 hover:text-indigo-600 font-mono flex items-center gap-1 transition-colors truncate mt-0.5"
                                    >
                                      <span>/projects/{p.slug}</span>
                                      <ExternalLink className="w-3 h-3 opacity-70" />
                                    </a>
                                  </div>
                                </div>
                              </td>

                              {/* Environment */}
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  Production
                                </span>
                              </td>

                              {/* Last Deployment */}
                              <td className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-slate-800">
                                    {lastDep
                                      ? new Date(lastDep.deployment.createdAt).toLocaleDateString()
                                      : "No deployments"}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    {lastDep ? `Deployment #${lastDep.deployment.slug}` : "--"}
                                  </span>
                                </div>
                              </td>

                              {/* Status Pill */}
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                                  Live
                                </span>
                              </td>

                              {/* Action Options Dropdown (Three Dots Menu Only) */}
                              <td className="py-4 px-6 text-right relative">
                                <div className="flex items-center justify-end">
                                  <button
                                    onClick={() =>
                                      setOpenActionDropdownId(
                                        openActionDropdownId === p.id ? null : p.id
                                      )
                                    }
                                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {openActionDropdownId === p.id && (
                                    <div className="absolute right-6 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 flex flex-col gap-1 text-xs text-left">
                                      <button
                                        onClick={() => openZipUploadModal(p)}
                                        className="w-full px-3 py-2 rounded-lg text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                                      >
                                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Deploy Zip</span>
                                      </button>
                                      <a
                                        href={`/projects/${p.slug}`}
                                        className="w-full px-3 py-2 rounded-lg text-left text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 transition-colors"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                        <span>View Details</span>
                                      </a>
                                      <button
                                        onClick={() => handleDeleteProject(p.id)}
                                        className="w-full px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-100 mt-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                        <span>Delete Project</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
                    <span>Showing 1 to {filteredProjects.length} of {filteredProjects.length} projects</span>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40" disabled>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 font-bold rounded-lg border border-indigo-100">
                        1
                      </span>
                      <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40" disabled>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Projects Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((p, idx) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col justify-between gap-6 shadow-xs hover:border-slate-200 transition-all"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm ${getBadgeColor(
                              idx
                            )}`}
                          >
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-[10px] font-bold text-emerald-700">
                            Production
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <a
                            href={`/projects/${p.slug}`}
                            className="font-bold text-base text-slate-900 hover:text-indigo-600 transition-colors"
                          >
                            {p.name}
                          </a>
                          <a
                            href={`/projects/${p.slug}`}
                            className="text-xs font-mono text-indigo-600 hover:underline flex items-center gap-1 mt-0.5 font-semibold"
                          >
                            <span>/projects/{p.slug}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                        <button
                          onClick={() => openZipUploadModal(p)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Deploy Zip</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          className="font-semibold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: DEPLOYMENTS TABLE VIEW (MATCHING DESIGN MOCKUP) ================= */}
          {activeNav === "deployments" && (
            <div className="flex flex-col gap-8 text-left">
              {/* Header Title & Top Right Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                    Deployments
                  </h1>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">
                    All deployments across your projects.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchProjects()}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Refresh</span>
                  </button>

                  <button
                    onClick={() => {
                      if (projects.length > 0) {
                        openZipUploadModal(projects[0]);
                      } else {
                        setIsModalOpen(true);
                      }
                    }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Deployment</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  {/* Search deployments input */}
                  <div className="relative w-full sm:w-64 flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
                    <input
                      type="text"
                      placeholder="Search deployments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Project Filter Dropdown */}
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 cursor-pointer">
                    <span className="text-slate-400">Project</span>
                    <select
                      className="appearance-none bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="All">All Projects</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.slug}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>

                  {/* Environment Filter Dropdown */}
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 cursor-pointer">
                    <span className="text-slate-400">Environment</span>
                    <select
                      value={environmentFilter}
                      onChange={(e) => setEnvironmentFilter(e.target.value)}
                      className="appearance-none bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="All">All</option>
                      <option value="Production">Production</option>
                      <option value="Staging">Staging</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>

                  {/* Status Filter Dropdown */}
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 cursor-pointer">
                    <span className="text-slate-400">Status</span>
                    <select
                      className="appearance-none bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="All">All</option>
                      <option value="Successful">Successful</option>
                      <option value="Failed">Failed</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>

                  {/* Sort by Filter Dropdown */}
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 cursor-pointer">
                    <span className="text-slate-400">Sort by</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="Latest">Latest</option>
                      <option value="Oldest">Oldest</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Deployments History Table Card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col overflow-hidden">
                <div className="overflow-x-auto min-h-[260px] pb-16">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-3.5 px-6">Deployment</th>
                        <th className="py-3.5 px-6">Project</th>
                        <th className="py-3.5 px-6">Environment</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6">Deployed At</th>
                        <th className="py-3.5 px-6">Duration</th>
                        <th className="py-3.5 px-6">Deployed By</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {allDeployments.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-12 text-center text-slate-400 text-xs"
                          >
                            No deployments found across projects. Upload a zip archive to deploy.
                          </td>
                        </tr>
                      ) : (
                        allDeployments.map((item, idx) => {
                          const projectInitial = item.project.name
                            ? item.project.name.charAt(0).toUpperCase()
                            : "P";

                          const isLatest = idx === 0;
                          const shortHash = item.deployment.id ? item.deployment.id.slice(0, 7) : item.deployment.slug;

                          return (
                            <tr
                              key={item.deployment.id || idx}
                              onClick={() => window.location.href = `/deployments/${item.deployment.id}`}
                              className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                            >
                              {/* Deployment Hash & Latest Pill */}
                              <td className="py-4 px-6">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">
                                      #{allDeployments.length - idx}
                                    </span>
                                    {isLatest && (
                                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                        Latest
                                      </span>
                                    )}
                                  </div>
                                  <a
                                    href={`${API_BASE_URL}/projects/${item.project.slug}/${item.deployment.slug}/`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs font-mono text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                  >
                                    <span>{shortHash}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                  </a>
                                </div>
                              </td>

                              {/* Project Avatar & Name */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3 truncate">
                                  <div
                                    className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 shadow-xs ${getBadgeColor(
                                      idx
                                    )}`}
                                  >
                                    {projectInitial}
                                  </div>
                                  <a
                                    href={`/projects/${item.project.slug}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-bold text-xs text-slate-900 hover:text-indigo-600 transition-colors truncate"
                                  >
                                    {item.project.slug}
                                  </a>
                                </div>
                              </td>

                              {/* Environment */}
                              <td className="py-4 px-6">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  Production
                                </span>
                              </td>

                              {/* Status Badge */}
                              <td className="py-4 px-6">
                                {item.deployment.status === "READY" ? (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Successful</span>
                                  </span>
                                ) : item.deployment.status === "FAILED" ? (
                                  <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[11px] font-bold border border-red-100 inline-flex items-center gap-1">
                                    <XCircle className="w-3.5 h-3.5 text-red-600" />
                                    <span>Failed</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-100 inline-flex items-center gap-1">
                                    <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                    <span>{item.deployment.status}</span>
                                  </span>
                                )}
                              </td>

                              {/* Deployed At */}
                              <td className="py-4 px-6 text-slate-500 font-medium">
                                {new Date(item.deployment.createdAt).toLocaleDateString()}
                              </td>

                              {/* Duration */}
                              <td className="py-4 px-6 text-slate-500 font-mono">
                                1m 17s
                              </td>

                              {/* Deployed By User Avatar */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                                    {userInitials}
                                  </div>
                                  <span className="text-xs font-semibold text-slate-800">
                                    {userName}
                                  </span>
                                </div>
                              </td>

                              {/* Actions Dropdown */}
                              <td className="py-4 px-6 text-right relative">
                                <div className="flex items-center justify-end">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenActionDropdownId(
                                        openActionDropdownId === item.deployment.id ? null : item.deployment.id
                                      );
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {openActionDropdownId === item.deployment.id && (
                                    <div className="absolute right-6 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 flex flex-col gap-1 text-xs text-left">
                                      <a
                                        href={`${API_BASE_URL}/projects/${item.project.slug}/${item.deployment.slug}/`}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full px-3 py-2 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-semibold flex items-center gap-2 transition-colors"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Visit Site</span>
                                      </a>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenActionDropdownId(null);
                                          handleRedeployDeployment(item.deployment.id);
                                        }}
                                        className="w-full px-3 py-2 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Redeploy</span>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteDeployment(item.deployment.id);
                                        }}
                                        className="w-full px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-100 mt-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                        <span>Delete Deployment</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer (Matching Mockup) */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
                  <span>Showing 1 to {allDeployments.length} of {allDeployments.length} deployments</span>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40" disabled>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 font-bold rounded-lg border border-indigo-100">
                      1
                    </span>
                    <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40" disabled>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 flex flex-col gap-6 text-left relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold text-slate-900">
                Create New Project
              </h3>
              <p className="text-xs text-slate-500">
                Deploy your static site or web app to BetterHost edge network.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="modalProjectName"
                  className="text-xs font-semibold text-slate-700"
                >
                  Project Name
                </label>
                <input
                  id="modalProjectName"
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. my-awesome-app"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm font-medium transition-all"
                />
              </div>

              {/* Target Route Preview */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Target Route Preview
                </span>
                <div className="font-mono text-xs text-indigo-700 font-bold truncate">
                  /projects/{slugPreview}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !projectName.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Project</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zip Upload Modal */}
      {selectedProjectForUpload && (
        <ZipPreviewModal
          isOpen={!!selectedProjectForUpload}
          onClose={() => setSelectedProjectForUpload(null)}
          project={selectedProjectForUpload}
          onDeploymentSuccess={fetchProjects}
        />
      )}
    </div>
  );
}
