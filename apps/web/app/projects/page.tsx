"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  LayoutGrid,
  Folder,
  Zap,
  Search,
  Bell,
  Plus,
  ExternalLink,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Trash2,
  Upload,
  LogOut,
  X,
  List,
} from "lucide-react";
import {
  getProjects,
  getAllDeployments,
  createProject,
  deleteProject,
  Project,
  DeploymentWithProject,
  UserResponse,
} from "@/lib/api";
import ZipPreviewModal from "@/app/components/ZipPreviewModal";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allDeployments, setAllDeployments] = useState<DeploymentWithProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [user, setUser] = useState<UserResponse | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [projectsLayout, setProjectsLayout] = useState<"table" | "grid">("table");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProjectForUpload, setSelectedProjectForUpload] = useState<Project | null>(null);
  const [isProjectsDropdownOpen, setIsProjectsDropdownOpen] = useState(true);
  const [isHeaderProfileOpen, setIsHeaderProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [openActionDropdownId, setOpenActionDropdownId] = useState<string | null>(null);

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

    fetchProjectsData();
  }, []);

  const fetchProjectsData = async () => {
    setLoadingProjects(true);
    try {
      const [projData, depsData] = await Promise.all([
        getProjects(),
        getAllDeployments(),
      ]);
      setProjects(projData || []);
      setAllDeployments(depsData || []);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("betterhost_token");
    localStorage.removeItem("betterhost_user");
    window.location.href = "/login";
  };

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setError(null);
    setCreating(true);

    try {
      const newProj = await createProject(projectName.trim());
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
    if (
      !confirm(
        "Are you sure you want to delete this project? All associated deployments will be deleted."
      )
    )
      return;
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setAllDeployments((prev) => prev.filter((d) => d?.project?.id !== projectId));
      setOpenActionDropdownId(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete project");
    }
  };

  const openZipUploadModal = (p: Project) => {
    setSelectedProjectForUpload(p);
    setOpenActionDropdownId(null);
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

  const getBadgeColor = (index: number) => {
    const colors = [
      "bg-slate-900 text-white",
      "bg-indigo-600 text-white",
      "bg-blue-600 text-white",
      "bg-emerald-600 text-white",
      "bg-purple-600 text-white",
    ];
    return colors[index % colors.length];
  };

  const matchingProjects = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const matchingDeployments = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allDeployments.filter(
      (item) =>
        (item?.deployment?.slug || "").toLowerCase().includes(q) ||
        (item?.project?.name || "").toLowerCase().includes(q) ||
        (item?.project?.slug || "").toLowerCase().includes(q)
    );
  }, [allDeployments, searchQuery]);

  const slugPreview = projectName.trim()
    ? projectName.trim().toLowerCase().replace(/\s+/g, "-")
    : "my-awesome-project";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 select-none">
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <a href="/dashboard" className="flex items-center">
            <Image
              src="/logo.png"
              alt="BetterHost Logo"
              width={220}
              height={54}
              className="h-10 w-auto object-contain scale-110 origin-left"
              priority
            />
          </a>
        </div>

        <div className="flex-1 px-3 py-4 flex flex-col justify-between overflow-y-auto">
          <div className="flex flex-col gap-1">
            <div className="px-2 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Platform
            </div>

            <a
              href="/dashboard"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <LayoutGrid className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Dashboard</span>
            </a>

            {/* Nav 2: Active Projects Route */}
            <div className="flex flex-col">
              <a
                href="/projects"
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-900 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Folder className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span>Projects</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </a>

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

            <a
              href="/deployments"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <Zap className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Deployments</span>
            </a>
          </div>

          <div className="pt-4 border-t border-slate-100">
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

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-100 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="relative w-full max-w-md">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
              <input
                id="global-search-input"
                type="text"
                placeholder="Search projects, deployments... (⌘K)"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                className="w-full pl-10 pr-10 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="absolute right-3 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-[10px] font-semibold text-slate-400">
                  ⌘ K
                </div>
              )}
            </div>

            {isSearchOpen && searchQuery.trim().length > 0 && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSearchOpen(false)}
                />
                <div className="absolute left-0 top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 flex flex-col gap-3 text-left animate-in fade-in zoom-in-95 duration-100 max-h-96 overflow-y-auto">
                  {matchingProjects.length === 0 && matchingDeployments.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Search className="w-6 h-6 text-slate-300" />
                      <span className="text-xs font-medium">
                        No projects or deployments found for &quot;{searchQuery}&quot;
                      </span>
                    </div>
                  ) : (
                    <>
                      {matchingProjects.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                            <Folder className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Projects ({matchingProjects.length})</span>
                          </div>
                          {matchingProjects.map((p) => (
                            <a
                              key={p.id}
                              href={`/projects/${p.slug}`}
                              onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery("");
                              }}
                              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/60 transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0">
                                  {p.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                    {p.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    /projects/{p.slug}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                            </a>
                          ))}
                        </div>
                      )}

                      {matchingDeployments.length > 0 && (
                        <div className="flex flex-col gap-1 border-t border-slate-100 pt-2">
                          <div className="px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Deployments ({matchingDeployments.length})</span>
                          </div>
                          {matchingDeployments.map((item) => (
                            <a
                              key={item.deployment.id}
                              href={`/projects/${item.project.slug}/${item.deployment.slug}/`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery("");
                              }}
                              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-xs shrink-0">
                                  #
                                </div>
                                <div className="flex flex-col truncate">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                      {item.deployment.slug}
                                    </span>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                        item.deployment.status === "READY"
                                          ? "bg-emerald-50 text-emerald-600"
                                          : "bg-amber-50 text-amber-600"
                                      }`}
                                    >
                                      {item.deployment.status}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 truncate">
                                    Project: {item.project.name}
                                  </span>
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-5">
            <button className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer relative">
              <Bell className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsHeaderProfileOpen(!isHeaderProfileOpen)}
                className="flex items-center gap-2.5 cursor-pointer select-none focus:outline-none p-1 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[11px]">
                  {userInitials}
                </div>
                <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                  {userName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isHeaderProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200/80 rounded-xl shadow-lg p-1.5 z-50 flex flex-col gap-1 text-left animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 flex flex-col">
                    <span className="text-xs font-bold text-slate-900 truncate">{userName}</span>
                    <span className="text-[10px] text-slate-400 truncate">{userEmail}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Projects Workspace Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl w-full mx-auto flex flex-col gap-8 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                Projects
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                Manage and deploy all your projects in one place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Layout Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                <button
                  onClick={() => setProjectsLayout("table")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    projectsLayout === "table"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  onClick={() => setProjectsLayout("grid")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    projectsLayout === "grid"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            </div>
          </div>

          {/* Projects View */}
          {loadingProjects ? (
            <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2 bg-white rounded-2xl border border-slate-100">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Loading projects workspace...</span>
            </div>
          ) : projects.length === 0 ? (
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
            /* Table View */
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
                    {projects.map((p, idx) => {
                      const initial = p.name ? p.name.charAt(0).toUpperCase() : "P";
                      const projectDeps = allDeployments.filter((d) => d?.project?.id === p.id);
                      const lastDep = projectDeps[0];

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
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

                          <td className="py-4 px-6">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Production
                            </span>
                          </td>

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

                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                              Live
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right relative">
                            <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenActionDropdownId(
                                    openActionDropdownId === p.id ? null : p.id
                                  );
                                }}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openActionDropdownId === p.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-6 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 flex flex-col gap-1 text-xs text-left animate-in fade-in zoom-in-95 duration-100"
                                >
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

              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
                <span>Showing 1 to {projects.length} of {projects.length} projects</span>
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
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((p, idx) => (
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
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                        Live
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <a
                        href={`/projects/${p.slug}`}
                        className="font-bold text-base text-slate-900 hover:text-indigo-600 transition-colors truncate"
                      >
                        {p.name}
                      </a>
                      <a
                        href={`/projects/${p.slug}`}
                        className="text-xs text-slate-400 hover:text-indigo-600 font-mono flex items-center gap-1 transition-colors mt-0.5 truncate"
                      >
                        <span>/projects/{p.slug}</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => openZipUploadModal(p)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Deploy Zip</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="font-semibold text-red-600 hover:underline flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 flex flex-col gap-6 text-left relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Folder className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Create New Project</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-semibold">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Portfolio Website"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Generated Route Slug
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600 truncate">
                  /projects/{slugPreview}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !projectName.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
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
          onDeploymentSuccess={fetchProjectsData}
        />
      )}
    </div>
  );
}
