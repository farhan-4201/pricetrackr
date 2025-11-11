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
    daraz?: number;
    alibaba?: number;
  };
  category: string;
  vendor?: string;
  url?: string;
  currentPrice?: number;
}

interface UpdateProductInput {
  name?: string;
  image?: string;
  prices?: {
    amazon?: number;
    ebay?: number;
    aliexpress?: number;
  };
  category?: string;
}

export interface WatchlistItem {
  _id: string;
  productId: string;
  name: string;
  image?: string;
  marketplace: string;
  category?: string;
  currentPrice?: number;
  url: string;
  isTracking?: boolean;
  addedAt: string;
  lastUpdated: string;
  notes?: string;
}

interface CreateWatchlistItemInput {
  productId: string;
  name: string;
  image?: string;
  marketplace: string;
  category?: string;
  currentPrice?: number;
  url: string;
  notes?: string;
}

interface AlertData {
  threshold: number;
  condition: 'above' | 'below';
  email?: boolean;
  sms?: boolean;
}

interface NotificationData {
  title: string;
  message: string;
  type: 'price_alert' | 'system' | 'info';
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
      baseURL: import.meta.env.VITE_API_BASE_URL ||
               (import.meta.env.PROD ? 'https://smartpricetracker.me' : 'http://localhost:8000'),
      version: import.meta.env.VITE_API_VERSION || 'v1',
      timeout: parseInt(import.meta.env.VITE_DEFAULT_TIMEOUT || '30000'),
      maxRetries: parseInt(import.meta.env.VITE_MAX_RETRIES || '3'),
    };
    this.baseURL = `${this.config.baseURL}/api/${this.config.version}`;
  }

  protected async request<T>(
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
      let controller: AbortController | null = null;
      let timeoutId: NodeJS.Timeout | null = null;

      try {
        controller = new AbortController();
        timeoutId = setTimeout(() => {
          controller!.abort("Request timeout");
        }, timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        lastError = error as Error;

        // Don't retry on client errors (4xx), timeout, or if it's the last attempt
        if (attempt === retries ||
            (error instanceof Error && (
              error.message.includes('HTTP 4') ||
              error.message.includes('Request timeout') ||
              error.name === 'AbortError'
            ))) {
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

class AuthenticatedApiClient extends ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const token = this.getAuthToken();

    const authenticatedHeaders: Record<string, string> = {
      ...config.headers,
    };

    if (token) {
      authenticatedHeaders['Authorization'] = `Bearer ${token}`;
    }

    const authenticatedConfig = {
      ...config,
      headers: authenticatedHeaders,
    };

    // Call the parent class request method with authenticated headers
    return super.request<T>(endpoint, options, authenticatedConfig);
  }
}

// Create singleton instances
export const apiClient = new ApiClient();
export const authenticatedApiClient = new AuthenticatedApiClient();

// Export as 'api' for backward compatibility
export const api = authenticatedApiClient;

export default apiClient;

// Types
interface User {
  _id: string;
  emailAddress: string;
  fullName: string;
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
  profilePicture: string | null;
}

interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

interface RegisterData {
  emailAddress: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  contactNumber: string;
}

interface LoginData {
  emailAddress: string;
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

export interface ScrapedProduct {
    name: string;
    price: number | null;
    url: string;
    imageUrl: string | null;
    marketplace: string;
    category?: string;
    rating?: string | number;
    company?: string;
}

export interface ScraperSources {
    daraz: {
        success: boolean;
        count: number;
        error?: string | null;
    };
    priceoye: {
        success: boolean;
        count: number;
        error?: string | null;
    };
    ebay: {
        success: boolean;
        count: number;
        error?: string | null;
    };
}

// Backend response interface
interface SearchResponse {
    success: boolean;
    query: string;
    products: ScrapedProduct[];
    total: number;
    sources: ScraperSources;
    timestamp: string;
    cached: boolean;
}

export const productsAPI = {
  // Get all products for current user
  getProducts: async () => {
    return authenticatedApiClient.get('/products');
  },

  // Create a new product
  createProduct: async (productData: CreateProductInput) => {
    return authenticatedApiClient.post('/products', productData);
  },

  // Update product price
  updatePrice: async (productId: string, price: number) => {
    return authenticatedApiClient.put(`/products/${productId}/price`, { price });
  },

  // Update product details
  updateProduct: async (productId: string, updates: UpdateProductInput) => {
    return authenticatedApiClient.put(`/products/${productId}`, updates);
  },

  // Delete product
  deleteProduct: async (productId: string) => {
    return authenticatedApiClient.delete(`/products/${productId}`);
  },

  // Search products
  searchProducts: async (query: string) => {
    return authenticatedApiClient.get(`/products/search?query=${encodeURIComponent(query)}`);
  },

  // Get product history
  getProductHistory: async (productId: string) => {
    return authenticatedApiClient.get(`/products/${productId}/history`);
  },

  // Get product statistics
  getStats: async () => {
    return authenticatedApiClient.get('/products/stats/overview');
  },

  // Create alert for product
  createAlert: async (productId: string, alertData: AlertData) => {
    return authenticatedApiClient.post(`/products/${productId}/alerts`, alertData);
  },

  // Update alert
  updateAlert: async (productId: string, alertId: string, updates: Partial<AlertData>) => {
    return authenticatedApiClient.put(`/products/${productId}/alerts/${alertId}`, updates);
  },

  // Scrape product from Daraz
  scrapeProduct: async (product_name: string) => {
    return apiClient.post('/products/scrape/daraz', { query: product_name });
  },

  // Get saved search results
  getSearchResults: async (query?: string, limit?: number, page?: number) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (limit) params.set('limit', limit.toString());
    if (page) params.set('page', page.toString());
    const queryString = params.toString();
    return apiClient.get(`/products/search-results${queryString ? '?' + queryString : ''}`);
  },

  // Updated scrape endpoint for Daraz
  searchDarazProducts: async (query: string): Promise<ScrapedProduct[]> => {
    try {
        console.log('[API] Calling Daraz scraper with query:', query);

        const response = await apiClient.post<{ products: ScrapedProduct[] }>('/products/scrape/daraz', {
            query
        });

        console.log('[API] Daraz response received:', response);

        if (!response || !response.products) {
            throw new Error('Invalid Daraz response format');
        }

        return response.products || [];
    } catch (error) {
        console.error('[API] Daraz API Error:', error);
        throw new Error(`Failed to fetch products from Daraz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // FIXED: Search with both scrapers - main search function
  searchAllMarketsProducts: async (query: string): Promise<ScrapedProduct[]> => {
    try {
        console.log('[API] Starting search for:', query);
        
        const response = await apiClient.post<SearchResponse>('/products/scrape', {
            query: query
        });

        console.log("[API] Raw response received:", response);
        console.log("[API] Response type:", typeof response);
        console.log("[API] Response.success:", response?.success);
        console.log("[API] Response.products length:", response?.products?.length);

        // Validate response structure
        if (!response) {
            console.error('[API] No response received from server');
            throw new Error('No response from server');
        }

        if (typeof response !== 'object') {
            console.error('[API] Response is not an object:', response);
            throw new Error('Invalid response format');
        }

        if (!response.success) {
            console.error('[API] Server returned failure:', response);
            throw new Error(`Server returned failure: ${JSON.stringify(response)}`);
        }

        if (!response.products) {
            console.error('[API] No products field in response:', response);
            throw new Error('No products in response');
        }

        if (!Array.isArray(response.products)) {
            console.error('[API] Products is not an array:', typeof response.products, response.products);
            throw new Error('Products field is not an array');
        }

        console.log(`[API] Successfully validated response with ${response.products.length} products`);
        
        if (response.products.length > 0) {
            console.log(`[API] First product sample:`, response.products[0]);
        }
        
        // ==== FIX: always return an array ====
        return response.products;

    } catch (error) {
        console.error('[API] searchAllMarketsProducts failed:', error);
        
        // Properly propagate the error instead of returning empty array
        if (error instanceof Error) {
            throw new Error(`Search failed: ${error.message}`);
        } else {
            throw new Error('Unknown search error occurred');
        }
    }
  },
};

// Notifications API functions
export const notificationsAPI = {
  // Get notifications
  getNotifications: async (params: { isRead?: boolean; limit?: number } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.isRead !== undefined) queryParams.set('isRead', params.isRead.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());

    const queryString = queryParams.toString();
    return authenticatedApiClient.get(`/notifications${queryString ? '?' + queryString : ''}`);
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    return authenticatedApiClient.put(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return authenticatedApiClient.put('/notifications/mark-all-read');
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    return authenticatedApiClient.delete(`/notifications/${notificationId}`);
  },

  // Get notification count
  getCount: async () => {
    return authenticatedApiClient.get('/notifications/count');
  },

  // Create notification
  createNotification: async (data: NotificationData) => {
    return authenticatedApiClient.post('/notifications', data);
  },
};

// Watchlist API functions
export const watchlistAPI = {
  // Get all watchlist items for current user
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    return authenticatedApiClient.get<WatchlistItem[]>('/watchlist');
  },

  // Add item to watchlist
  addToWatchlist: async (itemData: CreateWatchlistItemInput): Promise<WatchlistItem> => {
    return authenticatedApiClient.post<WatchlistItem>('/watchlist', itemData);
  },

  // Update watchlist item
  updateWatchlistItem: async (itemId: string, updates: Partial<WatchlistItem>): Promise<WatchlistItem> => {
    return authenticatedApiClient.put<WatchlistItem>(`/watchlist/${itemId}`, updates);
  },

  // Remove item from watchlist
  removeFromWatchlist: async (itemId: string): Promise<{ message: string }> => {
    return authenticatedApiClient.delete<{ message: string }>(`/watchlist/${itemId}`);
  },

  // Check if item is in watchlist
  checkWatchlistStatus: async (productId: string): Promise<{ inWatchlist: boolean; item?: WatchlistItem }> => {
    return authenticatedApiClient.get<{ inWatchlist: boolean; item?: WatchlistItem }>(`/watchlist/check/${productId}`);
  },

  // Get watchlist statistics
  getWatchlistStats: async () => {
    return authenticatedApiClient.get('/watchlist/stats');
  },
};
