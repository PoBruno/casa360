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

// Endpoints de Casas (house management)
export const housesApi = {
  getAll: () => request<any[]>("/houses"),
  getById: (id: string) => {
    if (!id) {
      return Promise.reject("House ID is required");
    }
    return request<any>(`/houses/${id}`);
  },
  create: (data: { name: string; description?: string; address?: string }) =>
    request<any>("/houses", { 
      method: "POST", 
      data: { 
        house_name: data.name,
        description: data.description,
        address: data.address
      } 
    }),
  update: (id: string, data: { name?: string; description?: string; address?: string }) => {
    if (!id) {
      return Promise.reject("House ID is required");
    }
    return request<any>(`/houses/${id}`, { 
      method: "PUT", 
      data: { 
        house_name: data.name,
        description: data.description,
        address: data.address
      } 
    });
  },
  delete: (id: string) => {
    if (!id) {
      return Promise.reject("House ID is required");
    }
    return request<void>(`/houses/${id}`, { method: "DELETE" });
  },
  join: (inviteCode: string) =>
    request<any>("/houses/join", { method: "POST", data: { inviteCode } }),
  leave: (id: string) => {
    if (!id) {
      return Promise.reject("House ID is required");
    }
    return request<void>(`/houses/${id}/leave`, { method: "POST" });
  },
  getMembers: (id: string) => {
    if (!id) {
      return Promise.reject("House ID is required");
    }
    return request<any[]>(`/houses/${id}/members`);
  },
  inviteMember: (id: string, email: string, role: string) => {
    if (!id) {
      return Promise.reject("House ID is required");
    }
    return request<any>(`/houses/${id}/invite`, { method: "POST", data: { email, role } });
  },
  updateMember: (houseId: string, userId: string, role: string) => {
    if (!houseId || !userId) {
      return Promise.reject("House ID and User ID are required");
    }
    return request<any>(`/houses/${houseId}/members/${userId}`, { method: "PUT", data: { role } });
  },
  removeMember: (houseId: string, userId: string) => {
    if (!houseId || !userId) {
      return Promise.reject("House ID and User ID are required");
    }
    return request<void>(`/houses/${houseId}/members/${userId}`, { method: "DELETE" });
  },
  transferOwnership: (houseId: string, newOwnerId: string) => {
    if (!houseId || !newOwnerId) {
      return Promise.reject("House ID and new owner ID are required");
    }
    return request<any>(`/houses/${houseId}/transfer-ownership`, { 
      method: "POST", 
      data: { new_owner_id: newOwnerId } 
    });
  },
};

// Endpoints de dados da casa (house data) - Nota o uso do URL /house/ (singular)
export const houseDataApi = {
  getDashboard: (houseId: string) => {
    if (!houseId) {
      return Promise.reject("House ID is required");
    }
    return request<any>(`/house/${houseId}/dashboard`);
  },
  
  // Categorias
  getCategories: (houseId: string) => {
    if (!houseId) {
      return Promise.reject("House ID is required");
    }
    return request<any[]>(`/house/${houseId}/categories`);
  },
  getCategoryById: (houseId: string, categoryId: string) => {
    if (!houseId || !categoryId) {
      return Promise.reject("House ID and Category ID are required");
    }
    return request<any>(`/house/${houseId}/categories/${categoryId}`);
  },
  
  // Centros de Custo
  getCostCenters: (houseId: string) => {
    if (!houseId) {
      return Promise.reject("House ID is required");
    }
    return request<any[]>(`/house/${houseId}/cost-centers`);
  },
  
  // Moedas
  getCurrencies: (houseId: string) => {
    if (!houseId) {
      return Promise.reject("House ID is required");
    }
    return request<any[]>(`/house/${houseId}/currencies`);
  },
  
  // Documentos
  getDocuments: (houseId: string) => {
    if (!houseId) {
      return Promise.reject("House ID is required");
    }
    return request<any[]>(`/house/${houseId}/documents`);
  },
  
  // Frequências
  getFrequencies: (houseId: string) => {
    if (!houseId) {
      return Promise.reject("House ID is required");
    }
    return request<any[]>(`/house/${houseId}/frequencies`);
  },
  
  // Pagadores
  getPayers: (houseId: string) => {
    if (!houseId) {
      return Promise.reject("House ID is required");
    }
    return request<any[]>(`/house/${houseId}/payers`);
  },
  
  // Pagamentos
  getPayments: (houseId: string) => {
    if (!houseId) {
      return Promise.reject("House ID is required");
    }
    return request<any[]>(`/house/${houseId}/payments`);
  },
  
  // Lançamentos financeiros
  getFinanceEntries: (houseId: string, params?: any) => {
    if (!houseId) {
      return Promise.reject("House ID is required");
    }
    return request<any>(`/house/${houseId}/finance-entries`, { params });
  },
  
  // Lançamentos de tarefas
  getTaskEntries: (houseId: string, params?: any) => {
    if (!houseId) {
      return Promise.reject("House ID is required");
    }
    return request<any>(`/house/${houseId}/task-entries`, { params });
  },
  
  // Tarefas
  getTasks: (houseId: string, params?: any) => {
    if (!houseId) {
      return Promise.reject("House ID is required");
    }
    
    return request<any>(`/house/${houseId}/tasks`, { params })
      .then(response => {
        // Make sure we have a valid response structure
        if (!response) {
          return { tasks: [], pagination: { total: 0, limit: 50, offset: 0, hasMore: false } };
        }
        
        // Handle different response formats
        if (Array.isArray(response)) {
          return { tasks: response, pagination: { total: response.length, limit: 50, offset: 0, hasMore: false } };
        }
        
        if (!response.tasks && !response.pagination) {
          return { tasks: [], pagination: { total: 0, limit: 50, offset: 0, hasMore: false } };
        }
        
        return response;
      })
      .catch(error => {
        console.error(`Failed to fetch tasks for house ${houseId}:`, error);
        // Return a valid but empty result instead of throwing
        return { tasks: [], pagination: { total: 0, limit: 50, offset: 0, hasMore: false } };
      });
  },
  getTaskById: (houseId: string, taskId: string) => {
    if (!houseId || !taskId) {
      return Promise.reject("House ID and Task ID are required");
    }
    return request<any>(`/house/${houseId}/tasks/${taskId}`);
  },
  completeTask: (houseId: string, taskId: string) => {
    if (!houseId || !taskId) {
      return Promise.reject("House ID and Task ID are required");
    }
    return request<any>(`/house/${houseId}/tasks/${taskId}/complete`, { method: "POST" });
  },
};

// Add this debugging function to help identify the issue

export async function debugTasksEndpoint(houseId: string): Promise<void> {
  if (typeof window === "undefined") return;
  
  const token = localStorage.getItem("casa360_token");
  if (!token) {
    console.error("No token available for debugging");
    return;
  }
  
  console.log("Debugging tasks endpoint for house:", houseId);
  
  try {
    // Make a vanilla fetch request to compare with axios
    const response = await fetch(`${API_BASE_URL}/house/${houseId}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const status = response.status;
    let data;
    
    try {
      data = await response.json();
    } catch (e) {
      data = "Failed to parse JSON";
    }
    
    console.log("Debug fetch result:", {
      status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    });
    
  } catch (error) {
    console.error("Debug fetch error:", error);
  }
}

// Endpoints de Tarefas (moved to houseDataApi)
export const tasksApi = {
  getAll: (houseId: string, params?: any) => {
    if (!houseId) {
      return Promise.reject("House ID is required");
    }
    return houseDataApi.getTasks(houseId, params);
  },
  getById: (houseId: string, taskId: string) => {
    if (!houseId || !taskId) {
      return Promise.reject("House ID and Task ID are required");
    }
    return houseDataApi.getTaskById(houseId, taskId);
  },
  complete: (houseId: string, taskId: string) => {
    if (!houseId || !taskId) {
      return Promise.reject("House ID and Task ID are required");
    }
    return houseDataApi.completeTask(houseId, taskId);
  }
};

export default {
  auth: authApi,
  houses: housesApi,
  houseData: houseDataApi,
  tasks: tasksApi,
};

