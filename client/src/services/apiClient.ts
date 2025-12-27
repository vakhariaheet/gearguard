// Get API URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
  private baseUrl: string;
  private getToken: (() => Promise<string | null>) | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAuthProvider(getToken: () => Promise<string | null>) {
    this.getToken = getToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add auth token if available
    if (this.getToken) {
      try {
        const token = await this.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as unknown as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // File upload helper
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const headers: Record<string, string> = {};

    // Add auth token if available
    if (this.getToken) {
      try {
        const token = await this.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Export types for convenience
export type { ApiClient };
