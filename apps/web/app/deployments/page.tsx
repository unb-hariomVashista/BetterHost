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
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  RotateCcw,
  Trash2,
  LogOut,
  X,
} from "lucide-react";
import {
  getAllDeployments,
  getProjects,
  deleteDeployment,
  redeployDeployment,
  API_BASE_URL,
  DeploymentWithProject,
  Project,
  UserResponse,
} from "@/lib/api";

export default function DeploymentsPage() {
  const [allDeployments, setAllDeployments] = useState<DeploymentWithProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserResponse | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Latest");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");

  const [isProjectsDropdownOpen, setIsProjectsDropdownOpen] = useState(true);
  const [isHeaderProfileOpen, setIsHeaderProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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

    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [depsData, projData] = await Promise.all([
        getAllDeployments(),
        getProjects(),
      ]);
      setAllDeployments(depsData || []);
      setProjects(projData || []);
    } catch (err) {
      console.error("Error fetching deployments data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("betterhost_token");
    localStorage.removeItem("betterhost_user");
    window.location.href = "/login";
  };

  const handleDeleteDeployment = async (deploymentId: string) => {
    if (!confirm("Are you sure you want to delete this deployment?")) return;
    try {
      await deleteDeployment(deploymentId);
      setAllDeployments((prev) => prev.filter((d) => d.id !== deploymentId));
      setOpenDropdownId(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete deployment");
    }
  };

  const handleRedeployDeployment = async (e: React.MouseEvent, deploymentId: string) => {
    e.stopPropagation();
    try {
      await redeployDeployment(deploymentId);
      alert("Redeploy process started successfully!");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to redeploy deployment");
    }
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

  const filteredDeployments = useMemo(() => {
    return allDeployments.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        (item?.deployment?.slug || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.project?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item?.project?.slug || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchProject =
        selectedProjectFilter === "All" || item?.project?.slug === selectedProjectFilter;

      const matchStatus =
        selectedStatusFilter === "All" ||
        (selectedStatusFilter === "Successful" && item?.deployment?.status === "READY") ||
        (selectedStatusFilter === "Failed" && item?.deployment?.status === "FAILED");

      return matchSearch && matchProject && matchStatus;
    });
  }, [allDeployments, searchQuery, selectedProjectFilter, selectedStatusFilter]);

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
        item.deployment.slug.toLowerCase().includes(q) ||
        item.project.name.toLowerCase().includes(q) ||
        item.project.slug.toLowerCase().includes(q)
    );
  }, [allDeployments, searchQuery]);

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

            <div className="flex flex-col">
              <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <a href="/projects" className="flex items-center gap-3 flex-1">
                  <Folder className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>Projects</span>
                </a>
                <button
                  onClick={() => setIsProjectsDropdownOpen(!isProjectsDropdownOpen)}
                  className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {isProjectsDropdownOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

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
                </div>
              )}
            </div>

            {/* Nav 3: Active Deployments Page Route */}
            <a
              href="/deployments"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-900 transition-all"
            >
              <Zap className="w-4 h-4 shrink-0 text-indigo-600" />
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

        {/* Deployments Workspace Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl w-full mx-auto flex flex-col gap-8 text-left">
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
                onClick={() => fetchData()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
              <span className="text-slate-400">Project</span>
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
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

            <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
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

            <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
              <span className="text-slate-400">Status</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="appearance-none bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All</option>
                <option value="Successful">Successful</option>
                <option value="Failed">Failed</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
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
          </div>

          {/* Table */}
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
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400 text-xs">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          <span>Loading deployments...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredDeployments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        No deployments found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDeployments.map((item, idx) => {
                      const projectSlug = item?.project?.slug || "unassigned";
                      const deploymentSlug = item?.deployment?.slug || "dep";
                      const deploymentId = item?.deployment?.id || "";
                      const status = item?.deployment?.status || "PENDING";
                      const createdAt = item?.deployment?.createdAt
                        ? new Date(item.deployment.createdAt).toLocaleDateString()
                        : "--";
                      const projectInitial = item?.project?.name
                        ? item.project.name.charAt(0).toUpperCase()
                        : "P";
                      const isLatest = idx === 0;
                      const shortHash = deploymentId ? deploymentId.slice(0, 7) : deploymentSlug;

                      return (
                        <tr
                          key={deploymentId || idx}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td
                            className="py-4 px-6 cursor-pointer"
                            onClick={() => window.location.href = `/deployments/${deploymentId}`}
                          >
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
                                href={`${API_BASE_URL}/projects/${projectSlug}/${deploymentSlug}/`}
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

                          <td
                            className="py-4 px-6 cursor-pointer"
                            onClick={() => window.location.href = `/deployments/${deploymentId}`}
                          >
                            <div className="flex items-center gap-3 truncate">
                              <div
                                className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 shadow-xs ${getBadgeColor(
                                  idx
                                )}`}
                              >
                                {projectInitial}
                              </div>
                              <a
                                href={`/projects/${projectSlug}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-bold text-xs text-slate-900 hover:text-indigo-600 transition-colors truncate"
                              >
                                {projectSlug}
                              </a>
                            </div>
                          </td>

                          <td
                            className="py-4 px-6 cursor-pointer"
                            onClick={() => window.location.href = `/deployments/${deploymentId}`}
                          >
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Production
                            </span>
                          </td>

                          <td
                            className="py-4 px-6 cursor-pointer"
                            onClick={() => window.location.href = `/deployments/${deploymentId}`}
                          >
                            {status === "READY" ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Successful</span>
                              </span>
                            ) : status === "FAILED" ? (
                              <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[11px] font-bold border border-red-100 inline-flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-red-600" />
                                <span>Failed</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-100 inline-flex items-center gap-1">
                                <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                <span>{status}</span>
                              </span>
                            )}
                          </td>

                          <td
                            className="py-4 px-6 text-slate-500 font-medium cursor-pointer"
                            onClick={() => window.location.href = `/deployments/${deploymentId}`}
                          >
                            {createdAt}
                          </td>

                          <td
                            className="py-4 px-6 text-slate-500 font-mono cursor-pointer"
                            onClick={() => window.location.href = `/deployments/${deploymentId}`}
                          >
                            1m 17s
                          </td>

                          <td
                            className="py-4 px-6 cursor-pointer"
                            onClick={() => window.location.href = `/deployments/${deploymentId}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                                {userInitials}
                              </div>
                              <span className="text-xs font-semibold text-slate-800">
                                {userName}
                              </span>
                            </div>
                          </td>

                          <td
                            className="py-4 px-6 text-right relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(
                                    openDropdownId === deploymentId ? null : deploymentId
                                  );
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openDropdownId === deploymentId && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-6 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 flex flex-col gap-1 text-xs text-left animate-in fade-in zoom-in-95 duration-100"
                                >
                                  <a
                                    href={`${API_BASE_URL}/projects/${projectSlug}/${deploymentSlug}/`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full px-3 py-2 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-semibold flex items-center gap-2 transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Visit Site</span>
                                  </a>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownId(null);
                                      handleRedeployDeployment(e, deploymentId);
                                    }}
                                    className="w-full px-3 py-2 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Redeploy</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownId(null);
                                      handleDeleteDeployment(deploymentId);
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
          </div>
        </main>
      </div>
    </div>
  );
}
