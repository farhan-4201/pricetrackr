import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  image: string;
  prices: {
    amazon?: number;
    ebay?: number;
    aliexpress?: number;
  };
  rating: number;
  reviews: number;
  priceChange: number;
  category: string;
}

interface CreateProductInput {
  name: string;
  image: string;
  prices: {
    amazon?: number;
    ebay?: number;
    aliexpress?: number;
  };
  category: string;
}

interface RequestConfig {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

interface ApiConfig {
  baseURL: string;
  version: string;
  timeout: number;
  maxRetries: number;
}

class ApiClient {
  private config: ApiConfig;
  private baseURL: string;

  constructor() {
    this.config = {
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      version: import.meta.env.VITE_API_VERSION || 'v1',
      timeout: parseInt(import.meta.env.VITE_DEFAULT_TIMEOUT || '30000'),
      maxRetries: parseInt(import.meta.env.VITE_MAX_RETRIES || '3'),
    };
    this.baseURL = `${this.config.baseURL}/api/${this.config.version}`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const timeout = config.timeout || this.config.timeout;
    const retries = config.retries || this.config.maxRetries;

    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) or if it's the last attempt
        if (attempt === retries ||
            (error instanceof Error && error.message.includes('HTTP 4'))) {
          break;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  public async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, config);
  }

  public async post<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    );
  }

  public async put<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    );
  }

  public async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, config);
  }

  public async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    );
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
export const authenticatedApiClient = new AuthenticatedApiClient();

export default apiClient;

// Types
interface User {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
}

interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

// Authentication API functions
export const authAPI = {
  // Register a new user
  register: async (userData: RegisterData): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/users/register', userData);
  },

  // Login user
  login: async (loginData: LoginData): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/users/login', loginData);
  },

  // Logout user
  logout: async (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/users/logout');
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    return apiClient.get<User>('/users/profile');
  },

  // Get user by email (public info)
  getUser: async (email: string): Promise<User> => {
    return apiClient.get<User>(`/users/email/${encodeURIComponent(email)}`);
  },

  // Get all users (admin only)
  getUsers: async (): Promise<User[]> => {
    return apiClient.get<User[]>('/users');
  },
};

// Products API functions
export const productsAPI = {
  // Get all products
  getProducts: async () => {
    return apiClient.get('/products');
  },

  // Create a new product
  createProduct: async (productData: CreateProductInput): Promise<Product> => {
    return apiClient.post<Product>('/products', productData);
  },
};
