import axios, { AxiosError, AxiosRequestConfig } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://20.206.149.83:3000/api";

// Cria uma instância do axios com configurações padrão
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Nova função de verificação de conexão usando GET na raiz como fallback
export async function checkApiConnection(): Promise<boolean> {
  try {
    // Use the health endpoint instead of the root path
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, { timeout: 5000 });
    return response.status >= 200 && response.status < 300;
  } catch (error: any) {
    console.error("API connection check failed:", error.message || error);
    return false;
  }
}

// Interceptador que adiciona o token nas requisições se disponível
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("casa360_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptador para lidar com erros e autenticação
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const publicRoutes = ["/", "/login", "/signup"];
      if (typeof window !== "undefined" && !publicRoutes.includes(window.location.pathname)) {
        localStorage.removeItem("casa360_token");
        localStorage.removeItem("casa360_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Função genérica de requisição usando axios
export async function request<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    data?: any;
    params?: any;
    headers?: Record<string, string>;
    timeout?: number;
  } = {}
): Promise<T> {
  try {
    const config: AxiosRequestConfig = {
      url: endpoint,
      method: options.method || "GET",
      data: options.data,
      params: options.params,
      headers: options.headers,
    };

    if (options.timeout) {
      config.timeout = options.timeout;
    }

    const response = await api.request<T>(config);
    return response.data;
  } catch (error: any) {
    console.error(`API request error for ${endpoint}:`, error);
    if (error.code === "ECONNABORTED") {
      throw "A conexão com o servidor demorou muito para responder. Tente novamente mais tarde.";
    }

    throw (
      error.response?.data?.message ||
      error.message ||
      "Erro desconhecido ao se comunicar com o servidor"
    );
  }
}

// Endpoints de Autenticação
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      data: { email, password },
    }),
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: any }>("/auth/register", {
      method: "POST",
      data: { username: name, email, password, full_name: name },
    }),
  // Atualizado para usar o endpoint que retorna perfil do usuário
  me: () => request<any>("/auth/profile"),
  updateProfile: (data: { name: string; email: string }) =>
    request<any>("/auth/profile", { method: "PUT", data }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<any>("/auth/change-password", { method: "PUT", data }),
};

// Endpoints de Casas
export const housesApi = {
  getAll: () => request<any[]>("/houses"),
  getById: (id: string) => request<any>(`/houses/${id}`),
  create: (data: { house_name: string; description?: string; address: string }) =>
    request<any>("/houses", { method: "POST", data }),
  update: (id: string, data: { house_name?: string; description?: string; address?: string }) =>
    request<any>(`/houses/${id}`, { method: "PUT", data }),
  delete: (id: string) => request<void>(`/houses/${id}`, { method: "DELETE" }),
  join: (inviteCode: string) =>
    request<any>("/houses/join", { method: "POST", data: { inviteCode } }),
  leave: (id: string) =>
    request<void>(`/houses/${id}/leave`, { method: "POST" }),
  getMembers: (id: string) => request<any[]>(`/houses/${id}/members`),
  inviteMember: (id: string, email: string, role: string) =>
    request<any>(`/houses/${id}/invite`, { method: "POST", data: { email, role } }),
  updateMember: (houseId: string, userId: string, role: string) =>
    request<any>(`/houses/${houseId}/members/${userId}`, { method: "PUT", data: { role } }),
  removeMember: (houseId: string, userId: string) =>
    request<void>(`/houses/${houseId}/members/${userId}`, { method: "DELETE" }),
};

// Endpoints de Tarefas
export const tasksApi = {
  getAll: (houseId: string) => request<any[]>(`/houses/${houseId}/tasks`),
  getById: (houseId: string, taskId: string) =>
    request<any>(`/houses/${houseId}/tasks/${taskId}`),
  create: (
    houseId: string,
    data: {
      title: string;
      description?: string;
      dueDate?: string;
      assignedTo?: string;
      status?: string;
      priority?: string;
      points?: number;
    }
  ) =>
    request<any>(`/houses/${houseId}/tasks`, { method: "POST", data }),
  update: (
    houseId: string,
    taskId: string,
    data: {
      title?: string;
      description?: string;
      dueDate?: string;
      assignedTo?: string;
      status?: string;
      priority?: string;
      points?: number;
    }
  ) =>
    request<any>(`/houses/${houseId}/tasks/${taskId}`, { method: "PUT", data }),
  delete: (houseId: string, taskId: string) =>
    request<void>(`/houses/${houseId}/tasks/${taskId}`, { method: "DELETE" }),
  complete: (houseId: string, taskId: string) =>
    request<any>(`/houses/${houseId}/tasks/${taskId}/complete`, { method: "POST" }),
};

export default {
  auth: authApi,
  houses: housesApi,
  tasks: tasksApi,
};

