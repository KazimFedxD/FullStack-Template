// src/utils/apiClient.js
import { getAccessToken } from './auth';
import { APP_CONFIG } from '../config/app';

// Simple API client that standardizes all API calls
class ApiClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL || APP_CONFIG.api.baseUrl;
  }

  async request(endpoint, options = {}) {
    const { 
      method = 'GET', 
      body = null, 
      headers = {}, 
      requireAuth = false,
      ...otherOptions 
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    
    // Prepare headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    // For authenticated requests with httpOnly cookies, we don't need manual headers
    // Just ensure credentials are included to send cookies
    if (requireAuth) {
      // Check if user is authenticated first
      const isAuthenticated = await getAccessToken();
      if (!isAuthenticated) {
        return { 
          ok: false, 
          data: { error: 'Authentication required' }, 
          status: 401 
        };
      }
    }

    // Prepare request options
    const requestOptions = {
      method,
      headers: requestHeaders,
      credentials: 'include', // Always include cookies
      ...otherOptions
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, requestOptions);
      
      // Handle response
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          return { ok: true, data, status: response.status };
        }
        return { ok: true, data: null, status: response.status };
      } else {
        // Try to get error message from response
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        return { 
          ok: false, 
          error: errorMessage, 
          status: response.status 
        };
      }
    } catch (error) {
      return { 
        ok: false, 
        error: error.message || 'Network error', 
        status: 0 
      };
    }
  }

  // Convenience methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Authenticated requests
  getAuth(endpoint, options = {}) {
    return this.get(endpoint, { ...options, requireAuth: true });
  }

  postAuth(endpoint, body, options = {}) {
    return this.post(endpoint, body, { ...options, requireAuth: true });
  }

  putAuth(endpoint, body, options = {}) {
    return this.put(endpoint, body, { ...options, requireAuth: true });
  }

  deleteAuth(endpoint, options = {}) {
    return this.delete(endpoint, { ...options, requireAuth: true });
  }
}

// Export a default instance
export const apiClient = new ApiClient(APP_CONFIG.api.baseUrl);

// Export convenience functions that match the existing API
export const apiGet = (endpoint, options = {}) => apiClient.get(endpoint, options);
export const apiPost = (endpoint, body, options = {}) => apiClient.post(endpoint, body, options);
export const apiPut = (endpoint, body, options = {}) => apiClient.put(endpoint, body, options);
export const apiDelete = (endpoint, options = {}) => apiClient.delete(endpoint, options);

export const apiGetAuth = (endpoint, options = {}) => apiClient.getAuth(endpoint, options);
export const apiPostAuth = (endpoint, body, options = {}) => apiClient.postAuth(endpoint, body, options);
export const apiPutAuth = (endpoint, body, options = {}) => apiClient.putAuth(endpoint, body, options);
export const apiDeleteAuth = (endpoint, options = {}) => apiClient.deleteAuth(endpoint, options);

export default apiClient;
