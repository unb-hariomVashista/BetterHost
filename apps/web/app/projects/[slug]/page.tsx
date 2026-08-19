"use client";

import { use, useEffect, useState } from "react";
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
  Settings,
  ArrowLeft,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  getProjects,
  getProjectDeployments,
  deleteProject,
  deleteDeployment,
  Project,
  Deployment,
  UserResponse,
} from "@/lib/api";
import ZipPreviewModal from "@/app/components/ZipPreviewModal";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [user, setUser] = useState<UserResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProjectsDropdownOpen, setIsProjectsDropdownOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"Deployments" | "Settings">("Deployments");
  const [searchQuery, setSearchQuery] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Latest");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("betterhost_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }

    fetchProjectData();
  }, [slug]);

  const fetchProjectData = async () => {
    setLoading(true);
    setError(null);

    try {
      const allProjects = await getProjects();
      setProjects(allProjects || []);

      const match = allProjects.find(
        (p) =>
          p.slug.toLowerCase() === slug.toLowerCase() ||
          (p as any).Slug?.toLowerCase() === slug.toLowerCase()
      );

      if (!match) {
        setError(`Project "${slug}" not found.`);
        setLoading(false);
        return;
      }

      setProject(match);

      // Fetch deployments for project
      const deps = await getProjectDeployments(match.id);
      setDeployments(deps || []);
    } catch (err: any) {
      console.error("Error loading project detail", err);
      setError(err.message || "Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      window.location.href = "/dashboard";
    } catch (err: any) {
      alert(err.message || "Failed to delete project");
      setIsDeleting(false);
    }
  };

  const handleDeleteDeployment = async (deploymentId: string) => {
    if (!confirm("Are you sure you want to delete this deployment?")) return;
    try {
      await deleteDeployment(deploymentId);
      setDeployments((prev) => prev.filter((d) => d.id !== deploymentId));
      setOpenDropdownId(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete deployment");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("betterhost_token");
    localStorage.removeItem("betterhost_user");
    window.location.href = "/login";
  };

  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.email || "User";

  const userInitials = user?.firstName
    ? `${user.firstName.charAt(0)}${
        user.lastName ? user.lastName.charAt(0) : ""
      }`.toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "HV";

  const userEmail = user?.email || "";

  const filteredDeployments = deployments.filter((d) =>
    d.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row">
      {/* ================= SHADCN-STYLE SIDEBAR ================= */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 select-none">
        {/* Header Branding */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <a href="/dashboard" className="flex items-center gap-2">
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
            <a
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <LayoutGrid className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Dashboard</span>
            </a>

            {/* Nav 2: Projects Dropdown Menu (Active Tab) */}
            <div className="flex flex-col">
              <button
                onClick={() => setIsProjectsDropdownOpen(!isProjectsDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-900 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Folder className="w-4 h-4 shrink-0 text-indigo-600" />
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
                      Loading projects...
                    </span>
                  ) : (
                    projects.map((p) => (
                      <a
                        key={p.id}
                        href={`/projects/${p.slug}`}
                        className={`px-2 py-1.5 rounded-md text-xs font-medium truncate flex items-center justify-between transition-colors ${
                          p.slug === slug
                            ? "bg-indigo-50 text-indigo-600 font-bold"
                            : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50"
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        {p.slug === slug && (
                          <ChevronRight className="w-3 h-3 text-indigo-600" />
                        )}
                      </a>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Nav 3: Deployments */}
            <a
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <Zap className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Deployments</span>
            </a>
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
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-100 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="relative w-full max-w-md flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              placeholder="Search projects, deployments..."
              className="w-full pl-10 pr-12 py-2 bg-slate-50/70 border border-slate-200/60 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
            <div className="absolute right-3 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-semibold text-slate-400">
              ⌘ K
            </div>
          </div>

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

        {/* Main Project Detail Workspace */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-8 text-left overflow-y-auto">
          {loading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-sm font-medium">Loading project details...</span>
            </div>
          ) : error || !project ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center flex flex-col items-center gap-4">
              <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
              <p className="text-xs text-slate-500 max-w-md">{error}</p>
              <a
                href="/dashboard"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
              >
                Back to Dashboard
              </a>
            </div>
          ) : (
            <>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <a href="/dashboard" className="hover:text-indigo-600 flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Projects</span>
                </a>
                <span>&gt;</span>
                <span className="text-slate-800 font-bold">{project.slug}</span>
              </div>

              {/* Project Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {/* Large Letter Badge */}
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white font-extrabold text-2xl flex items-center justify-center shadow-sm shrink-0">
                    {project.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {project.name}
                      </h1>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Production
                      </span>
                    </div>

                    <a
                      href={`http://localhost:8080/projects/${project.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 font-mono flex items-center gap-1 hover:underline font-semibold"
                    >
                      <span>/projects/{project.slug}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <span className="text-[11px] text-slate-400">
                      Created on {new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* New Deployment Button Only (Removed Project Settings) */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Deployment</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </div>
              </div>

              {/* Project Tabs Header (Deployments & Settings Only) */}
              <div className="border-b border-slate-200/80 flex items-center gap-8 text-xs font-semibold">
                {(["Deployments", "Settings"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 transition-colors cursor-pointer border-b-2 -mb-[1px] ${
                      activeTab === tab
                        ? "border-indigo-600 text-indigo-600 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* TAB 1: Deployments */}
              {activeTab === "Deployments" && (
                <div className="flex flex-col gap-6">
                  {/* Search & Filter Header Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <h2 className="text-xl font-bold text-slate-900">Deployments</h2>
                      <p className="text-xs text-slate-500">
                        All deployments for this project.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Search Input */}
                      <div className="relative w-56 flex items-center">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3" />
                        <input
                          type="text"
                          placeholder="Search deployments..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>

                      {/* Environment Filter */}
                      <div className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 cursor-pointer">
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

                      {/* Sort Filter */}
                      <div className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 cursor-pointer">
                        <span className="text-slate-400">Sort by</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="appearance-none bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
                        >
                          <option value="Latest">Latest</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>

                      {/* Refresh Button */}
                      <button
                        onClick={fetchProjectData}
                        className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                        title="Refresh"
                      >
                        ↻
                      </button>
                    </div>
                  </div>

                  {/* Deployments Table View */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col">
                    <div className="overflow-x-auto min-h-[260px] pb-16">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                            <th className="py-3.5 px-6">Deployment</th>
                            <th className="py-3.5 px-6">Environment</th>
                            <th className="py-3.5 px-6">Status</th>
                            <th className="py-3.5 px-6">Deployed At</th>
                            <th className="py-3.5 px-6">Duration</th>
                            <th className="py-3.5 px-6">Deployed By</th>
                            <th className="py-3.5 px-6 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                          {filteredDeployments.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                                No deployments found. Click "New Deployment" to upload a zip.
                              </td>
                            </tr>
                          ) : (
                            filteredDeployments.map((dep, idx) => (
                              <tr
                                key={dep.id}
                                onClick={() => window.location.href = `/deployments/${dep.id}`}
                                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                              >
                                <td className="py-4 px-6">
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-slate-900 text-sm">
                                        #{dep.slug}
                                      </span>
                                      {idx === 0 && (
                                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                                          Latest
                                        </span>
                                      )}
                                    </div>
                                    <a
                                      href={`http://localhost:8080/projects/${project.slug}/${dep.slug}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-mono text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                                    >
                                      <span>a1b2c3d</span>
                                      <ExternalLink className="w-3 h-3 opacity-70" />
                                    </a>
                                  </div>
                                </td>

                                <td className="py-4 px-6">
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Production
                                  </span>
                                </td>

                                <td className="py-4 px-6">
                                  {dep.status === "READY" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Successful</span>
                                    </span>
                                  ) : dep.status === "FAILED" ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-100">
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Failed</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>{dep.status}</span>
                                    </span>
                                  )}
                                </td>

                                <td className="py-4 px-6 text-slate-500">
                                  {new Date(dep.createdAt).toLocaleString()}
                                </td>

                                <td className="py-4 px-6 font-mono text-slate-500">
                                  1m 17s
                                </td>

                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                                      {userInitials}
                                    </div>
                                    <span className="font-semibold text-slate-800 text-xs">
                                      {userName}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-4 px-6 text-right relative">
                                  <div className="flex items-center justify-end">
                                    <button
                                      onClick={() =>
                                        setOpenDropdownId(openDropdownId === dep.id ? null : dep.id)
                                      }
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {openDropdownId === dep.id && (
                                      <div className="absolute right-6 top-10 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 flex flex-col gap-1 text-xs text-left">
                                        <a
                                          href={`http://localhost:8080/projects/${project.slug}/${dep.slug}/`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="w-full px-3 py-2 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-semibold flex items-center gap-2 transition-colors"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                                          <span>Visit Site</span>
                                        </a>
                                        <button
                                          onClick={() => handleDeleteDeployment(dep.id)}
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
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
                      <span>
                        Showing 1 to {filteredDeployments.length} of {filteredDeployments.length} deployments
                      </span>
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

              {/* TAB 2: Settings (Project Settings & Delete Option) */}
              {activeTab === "Settings" && (
                <div className="flex flex-col gap-8 max-w-3xl">
                  {/* General Information Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-xs flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                      <h2 className="text-lg font-bold text-slate-900">Project General Information</h2>
                      <p className="text-xs text-slate-500">
                        View basic configuration for this project.
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 text-xs">
                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-slate-700">Project Name</label>
                        <input
                          type="text"
                          readOnly
                          value={project.name}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-slate-700">Project Slug & Route</label>
                        <input
                          type="text"
                          readOnly
                          value={`/projects/${project.slug}`}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-indigo-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone: Delete Project Option */}
                  <div className="bg-red-50/50 rounded-2xl border border-red-200/80 p-6 md:p-8 shadow-xs flex flex-col gap-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          Danger Zone
                        </h3>
                        <p className="text-xs text-red-700 leading-relaxed max-w-md">
                          Permanently delete this project and all associated deployments. This action cannot be undone.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowDeleteConfirmModal(true)}
                        className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Project</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 flex flex-col gap-6 text-left relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Delete Project</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">{project?.name}</strong>? All extracted deployment files and routes will be deleted forever.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zip Upload Modal */}
      {project && (
        <ZipPreviewModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          project={project}
          onDeploymentSuccess={fetchProjectData}
        />
      )}
    </div>
  );
}
