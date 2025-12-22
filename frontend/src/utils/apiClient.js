// Simple API client class - alternative to function-based api.js

import { getAccessToken } from './auth';

// Simple API client that standardizes all API calls
class ApiClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const { 
      method = 'GET', 
      body = null, 
      headers = {}, 
      requireAuth = false,
      ...otherOptions 
    } = options;

    // Ensure endpoint starts with / for relative URLs
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = this.baseURL ? `${this.baseURL}${normalizedEndpoint}` : normalizedEndpoint;
    
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
          errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage;
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

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
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

  patchAuth(endpoint, body, options = {}) {
    return this.patch(endpoint, body, { ...options, requireAuth: true });
  }

  deleteAuth(endpoint, options = {}) {
    return this.delete(endpoint, { ...options, requireAuth: true });
  }
}

// Export a default instance (empty baseURL for Nginx proxy)
export const apiClient = new ApiClient('');

// Export convenience functions that match the existing API
export const clientGet = (endpoint, options = {}) => apiClient.get(endpoint, options);
export const clientPost = (endpoint, body, options = {}) => apiClient.post(endpoint, body, options);
export const clientPut = (endpoint, body, options = {}) => apiClient.put(endpoint, body, options);
export const clientPatch = (endpoint, body, options = {}) => apiClient.patch(endpoint, body, options);
export const clientDelete = (endpoint, options = {}) => apiClient.delete(endpoint, options);

export const clientGetAuth = (endpoint, options = {}) => apiClient.getAuth(endpoint, options);
export const clientPostAuth = (endpoint, body, options = {}) => apiClient.postAuth(endpoint, body, options);
export const clientPutAuth = (endpoint, body, options = {}) => apiClient.putAuth(endpoint, body, options);
export const clientPatchAuth = (endpoint, body, options = {}) => apiClient.patchAuth(endpoint, body, options);
export const clientDeleteAuth = (endpoint, options = {}) => apiClient.deleteAuth(endpoint, options);

export { ApiClient };
export default apiClient;
