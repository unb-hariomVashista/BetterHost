"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import {
  LayoutGrid,
  Folder,
  Zap,
  FileText,
  HelpCircle,
  Search,
  Bell,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Upload,
  RotateCcw,
  Download,
  Maximize2,
  Code2,
  Rocket,
  Globe,
  ArrowLeft,
  Trash2,
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

interface DeploymentPageProps {
  params: Promise<{ id: string }>;
}

export default function DeploymentInspectionPage({
  params,
}: DeploymentPageProps) {
  const { id } = use(params);

  const [deploymentItem, setDeploymentItem] =
    useState<DeploymentWithProject | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<UserResponse | null>(null);
  const [isProjectsDropdownOpen, setIsProjectsDropdownOpen] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("betterhost_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }

    loadData();
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (
      deploymentItem &&
      (deploymentItem.status === "QUEUED" ||
        deploymentItem.status === "DEPLOYING" ||
        deploymentItem.status === "BUILDING")
    ) {
      interval = setInterval(() => {
        loadData(false);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deploymentItem?.status, id]);

  const loadData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const [allDeps, projs] = await Promise.all([
        getAllDeployments(),
        getProjects(),
      ]);

      setProjects(projs || []);

      const match = (allDeps || []).find((d) => d.id === id || d.slug === id);

      if (!match) {
        setError(`Deployment '${id}' not found`);
      } else {
        setDeploymentItem(match);
      }
    } catch (err: any) {
      console.error("Error loading deployment inspection", err);
      setError(err.message || "Failed to load deployment inspection details");
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleRedeploy = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!deploymentItem) return;
    try {
      setLoading(true);
      await redeployDeployment(deploymentItem.id);
      await loadData(false);
    } catch (err: any) {
      alert(err.message || "Failed to redeploy deployment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deploymentItem) return;
    if (!confirm("Are you sure you want to delete this deployment?")) return;

    try {
      await deleteDeployment(deploymentItem.id);
      window.location.href = "/dashboard";
    } catch (err: any) {
      alert(err.message || "Failed to delete deployment");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("betterhost_token");
    localStorage.removeItem("betterhost_user");
    window.location.href = "/login";
  };

  // Derive user info
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.email || "User";

  const userInitials = user?.firstName
    ? `${user.firstName.charAt(0)}${
        user.lastName ? user.lastName.charAt(0) : ""
      }`.toUpperCase()
    : user?.email
      ? user.email.slice(0, 2).toUpperCase()
      : "U";

  const userEmail = user?.email || "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row">
      {/* ================= SHADCN SIDEBAR ================= */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 select-none">
        {/* Header Branding */}
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

        {/* Navigation Items */}
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

            {/* Projects Dropdown */}
            <div className="flex flex-col">
              <div className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all">
                <a href="/projects" className="flex items-center gap-3 flex-1">
                  <Folder className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>Projects</span>
                </a>
                <button
                  onClick={() =>
                    setIsProjectsDropdownOpen(!isProjectsDropdownOpen)
                  }
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
                  {projects.map((p) => (
                    <a
                      key={p.id}
                      href={`/projects/${p.slug}`}
                      className={`px-2 py-1.5 rounded-md text-xs font-medium truncate flex items-center justify-between transition-colors ${
                        deploymentItem?.projectSlug === p.slug
                          ? "text-indigo-600 bg-indigo-50 font-bold"
                          : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50"
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

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
                className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-1"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-100 bg-white px-6 flex items-center justify-between shrink-0">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <a href="/dashboard" className="text-indigo-600 hover:underline">
              Deployments
            </a>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 font-bold">
              Deployment #{deploymentItem?.slug || id}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer select-none">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[11px]">
                {userInitials}
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                {userName}
              </span>
            </div>
          </div>
        </header>

        {/* Main Workspace Area */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl w-full mx-auto flex flex-col gap-8 text-left">
          {loading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-xs font-semibold">
                Loading deployment inspection...
              </span>
            </div>
          ) : error || !deploymentItem ? (
            <div className="p-12 bg-white rounded-2xl border border-red-100 text-center flex flex-col items-center gap-3">
              <XCircle className="w-10 h-10 text-red-500" />
              <h2 className="text-lg font-bold text-slate-900">
                Deployment Not Found
              </h2>
              <p className="text-xs text-slate-500">{error}</p>
              <a
                href="/dashboard"
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Deployments</span>
              </a>
            </div>
          ) : (
            <>
              {/* Back to Deployments Button & Inspection Title Bar */}
              <div className="flex flex-col gap-4">
                <a
                  href="/dashboard"
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 w-fit"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Deployments</span>
                </a>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                        Deployment #{deploymentItem.slug} Inspection
                      </h1>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {deploymentItem.status === "READY"
                            ? "READY"
                            : deploymentItem.status}
                        </span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-mono">
                      Target Route: /projects/{deploymentItem.projectSlug}/
                      {deploymentItem.slug}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRedeploy}
                      className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer bg-white"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Redeploy</span>
                    </button>

                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer bg-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                    <a
                      href={`${API_BASE_URL}/projects/${deploymentItem.projectSlug}/${deploymentItem.slug}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* 5-Step Pipeline Stepper */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-xs">
                <div className="relative flex items-center justify-between max-w-4xl mx-auto">
                  <div className="absolute left-8 right-8 top-5 h-0.5 bg-slate-200 z-0"></div>

                  {/* Step 1: Upload */}
                  <div className="relative z-10 flex flex-col items-center gap-2 text-center bg-white px-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">
                        Upload
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        Completed
                      </span>
                    </div>
                  </div>

                  {/* Step 2: Analyze */}
                  <div className="relative z-10 flex flex-col items-center gap-2 text-center bg-white px-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                      <Search className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">
                        Analyze
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        Completed
                      </span>
                    </div>
                  </div>

                  {/* Step 3: Build */}
                  <div className="relative z-10 flex flex-col items-center gap-2 text-center bg-white px-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">
                        Build
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        Completed
                      </span>
                    </div>
                  </div>

                  {/* Step 4: Deploy */}
                  <div className="relative z-10 flex flex-col items-center gap-2 text-center bg-white px-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                      <Rocket className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">
                        Deploy
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        Completed
                      </span>
                    </div>
                  </div>

                  {/* Step 5: Live */}
                  <div className="relative z-10 flex flex-col items-center gap-2 text-center bg-white px-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">
                        Live
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600">
                        Ready
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Build Logs Terminal & Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Terminal Build Logs */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900">
                      Build Logs
                    </h3>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 flex items-center gap-1 cursor-pointer">
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Download</span>
                      </button>
                      <button className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-50 cursor-pointer">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 rounded-xl p-5 font-mono text-xs text-slate-200 flex flex-col gap-2 overflow-x-auto leading-relaxed shadow-inner border border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">&gt;</span>
                      <span>
                        Upload received archive for deployment{" "}
                        {deploymentItem.slug}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span className="text-slate-200">
                        Files extracted and verified successfully
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">&gt;</span>
                      <span>
                        Framework detected:{" "}
                        <span className="text-cyan-400 font-bold">
                          Static Web App
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>
                        Output path:{" "}
                        <span className="text-slate-400">
                          storage/deployments/{deploymentItem.projectSlug}/
                          {deploymentItem.slug}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Verified index entrypoint</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span className="text-emerald-400 font-bold">
                        Deployment is live at /projects/
                        {deploymentItem.projectSlug}/{deploymentItem.slug}/
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Deployment Details */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col gap-4">
                  <h3 className="font-bold text-base text-slate-900">
                    Deployment Details
                  </h3>
                  <div className="flex flex-col gap-3 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Environment</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Production
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Domain</span>
                      <a
                        href={`${API_BASE_URL}/projects/${deploymentItem.projectSlug}/${deploymentItem.slug}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-indigo-600 font-bold hover:underline flex items-center gap-1 truncate max-w-[170px]"
                      >
                        <span className="truncate">
                          /projects/{deploymentItem.projectSlug}/
                          {deploymentItem.slug}
                        </span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Runtime</span>
                      <span className="font-semibold text-slate-800">
                        Static Web App
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Deployed By</span>
                      <span className="font-semibold text-slate-800">
                        {userName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Deployed At</span>
                      <span className="font-medium text-slate-800">
                        {new Date(
                          deploymentItem.createdAt,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
