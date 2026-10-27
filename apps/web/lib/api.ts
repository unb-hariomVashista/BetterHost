export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const parsed = JSON.parse(text);
      return parsed.error || parsed.message || text;
    } catch {
      return text;
    }
  } catch {
    return fallback;
  }
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await parseErrorMessage(res, "Registration failed");
    throw new Error(errorText);
  }

  return res.json();
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await parseErrorMessage(res, "Invalid email or password");
    throw new Error(errorText);
  }

  return res.json();
}

export async function getCurrentUser(token: string): Promise<UserResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user");
  }

  return res.json();
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export async function createProject(name: string): Promise<Project> {
  const token = typeof window !== "undefined" ? localStorage.getItem("betterhost_token") : null;

  const res = await fetch(`${API_BASE_URL}/api/v1/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const errorText = await parseErrorMessage(res, "Failed to create project");
    throw new Error(errorText);
  }

  return res.json();
}

export async function getProjects(): Promise<Project[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("betterhost_token") : null;

  const res = await fetch(`${API_BASE_URL}/api/v1/projects`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorText = await parseErrorMessage(res, "Failed to fetch projects");
    throw new Error(errorText);
  }

  return res.json();
}

export interface Deployment {
  id: string;
  projectId: string;
  slug: string;
  entrypoint: string;
  artifactPath: string;
  status: "QUEUED" | "BUILDING" | "DEPLOYING" | "READY" | "FAILED" | "TERMINATED";
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentWithProject extends Deployment {
  projectName: string;
  projectSlug: string;
  userId?: string;
  deployment: Deployment;
  project: {
    id: string;
    name: string;
    slug: string;
  };
}

export async function getAllDeployments(): Promise<DeploymentWithProject[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("betterhost_token") : null;

  const res = await fetch(`${API_BASE_URL}/api/v1/deployments`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch deployments");
  }

  const raw: any[] = await res.json();

  return (raw || []).map((item) => {
    const dep: DeploymentWithProject = {
      ...item,
      id: item.id || item.deployment?.id || "",
      projectId: item.projectId || item.project?.id || "",
      slug: item.slug || item.deployment?.slug || "",
      entrypoint: item.entrypoint || item.deployment?.entrypoint || "index.html",
      artifactPath: item.artifactPath || item.deployment?.artifactPath || "",
      status: item.status || item.deployment?.status || "READY",
      createdAt: item.createdAt || item.deployment?.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.deployment?.updatedAt || new Date().toISOString(),
      projectName: item.projectName || item.project?.name || "Project",
      projectSlug: item.projectSlug || item.project?.slug || "project",
      userId: item.userId || item.project?.userId || "",
    };

    dep.deployment = item.deployment || {
      id: dep.id,
      projectId: dep.projectId,
      slug: dep.slug,
      entrypoint: dep.entrypoint,
      artifactPath: dep.artifactPath,
      status: dep.status,
      createdAt: dep.createdAt,
      updatedAt: dep.updatedAt,
    };

    dep.project = item.project || {
      id: dep.projectId,
      name: dep.projectName,
      slug: dep.projectSlug,
    };

    return dep;
  });
}

export async function uploadDeploymentZip(
  projectId: string,
  file: File,
  slug?: string
): Promise<Deployment> {
  const token = typeof window !== "undefined" ? localStorage.getItem("betterhost_token") : null;

  const formData = new FormData();
  formData.append("file", file);
  if (slug) {
    formData.append("slug", slug);
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/deployments`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await parseErrorMessage(res, "Failed to upload zip deployment");
    throw new Error(errorText);
  }

  return res.json();
}

export async function getProjectDeployments(projectId: string): Promise<Deployment[]> {
  const token = typeof window !== "undefined" ? localStorage.getItem("betterhost_token") : null;

  const res = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/deployments`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorText = await parseErrorMessage(res, "Failed to fetch deployments");
    throw new Error(errorText);
  }

  return res.json();
}

export async function deleteProject(projectId: string): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("betterhost_token") : null;

  const res = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorText = await parseErrorMessage(res, "Failed to delete project");
    throw new Error(errorText);
  }
}

export async function deleteDeployment(deploymentId: string): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("betterhost_token") : null;

  const res = await fetch(`${API_BASE_URL}/api/v1/deployments/${deploymentId}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorText = await parseErrorMessage(res, "Failed to delete deployment");
    throw new Error(errorText);
  }
}

export async function redeployDeployment(deploymentId: string): Promise<Deployment> {
  const token = typeof window !== "undefined" ? localStorage.getItem("betterhost_token") : null;

  const res = await fetch(`${API_BASE_URL}/api/v1/deployments/${deploymentId}/redeploy`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorText = await parseErrorMessage(res, "Failed to redeploy");
    throw new Error(errorText);
  }

  return res.json();
}
