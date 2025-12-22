// Generic API utilities - handles all API calls with retries, timeouts, and error handling

import { getAccessToken, refreshAccessToken, clearAuthData } from './auth';
import { createErrorFromResponse, logError } from './errorHandler';

// API configuration
const API_CONFIG = {
  timeout: 15000, // 15 seconds
  maxRetries: 3,
  retryDelay: 1000 // 1 second base delay
};

// Create fetch with timeout
const fetchWithTimeout = (url, options = {}, timeout = API_CONFIG.timeout) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Retry logic with exponential backoff
const fetchWithRetry = async (url, options, maxRetries = API_CONFIG.maxRetries) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      
      // Don't retry on client errors (4xx) except 401
      if (response.status >= 400 && response.status < 500 && response.status !== 401) {
        return response;
      }
      
      // Retry on server errors (5xx) and 401
      if (response.ok || attempt === maxRetries) {
        return response;
      }
      
      // Wait before retry with exponential backoff
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, API_CONFIG.retryDelay * Math.pow(2, attempt))
        );
      }
    } catch (error) {
      lastError = error;
      
      // Don't retry on network errors if offline
      if (!navigator.onLine) {
        throw error;
      }
      
      // Don't retry on abort (timeout)
      if (error.name === 'AbortError') {
        throw error;
      }
      
      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, API_CONFIG.retryDelay * Math.pow(2, attempt))
        );
      }
    }
  }
  
  throw lastError;
};

// Build full URL from endpoint
const buildUrl = (endpoint) => {
  // If endpoint is already a full URL, return it
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Base URL is empty for Nginx proxy - just use the endpoint directly
  return normalizedEndpoint;
};

// Main API call function
export const apiCall = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    headers = {},
    requireAuth = false,
    skipRetry = false,
    ...otherOptions
  } = options;

  const url = buildUrl(endpoint);

  try {
    // Prepare headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    // Add auth header if required
    if (requireAuth) {
      const token = await getAccessToken();
      if (!token) {
        return {
          ok: false,
          status: 401,
          error: {
            type: 'authentication',
            title: 'Authentication Required',
            message: 'Please log in to continue.',
            canRetry: false
          }
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

    // Make the request
    const response = skipRetry 
      ? await fetchWithTimeout(url, requestOptions)
      : await fetchWithRetry(url, requestOptions);

    // Handle 401 - try to refresh token
    if (response.status === 401 && requireAuth) {
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry with new token
          const retryResponse = await fetchWithTimeout(url, requestOptions);
          
          if (retryResponse.ok) {
            try {
              const data = await retryResponse.json();
              return { ok: true, status: retryResponse.status, data };
            } catch (parseError) {
              return { ok: true, status: retryResponse.status, data: null };
            }
          }
          
          // If retry also fails, treat as auth error
          const errorInfo = await createErrorFromResponse(null, retryResponse);
          return { ok: false, status: retryResponse.status, error: errorInfo };
        }
      } catch (refreshError) {
        // Token refresh failed, clear auth data
        clearAuthData();
        const errorInfo = await createErrorFromResponse(refreshError, response);
        return { ok: false, status: 401, error: errorInfo };
      }
    }

    // Handle successful response
    if (response.ok) {
      try {
        const data = await response.json();
        return { ok: true, status: response.status, data };
      } catch (parseError) {
        // Response was ok but couldn't parse JSON
        return { ok: true, status: response.status, data: null };
      }
    }

    // Handle error response
    const errorInfo = await createErrorFromResponse(null, response);
    return { ok: false, status: response.status, error: errorInfo };

  } catch (error) {
    // Handle network/timeout errors
    logError(error, `API call to ${endpoint}`);
    const errorInfo = await createErrorFromResponse(error, null);
    
    return { ok: false, status: 0, error: errorInfo };
  }
};

// Convenience methods
export const apiGet = (endpoint, options = {}) => 
  apiCall(endpoint, { ...options, method: 'GET' });

export const apiPost = (endpoint, body = null, options = {}) => 
  apiCall(endpoint, { ...options, method: 'POST', body });

export const apiPut = (endpoint, body = null, options = {}) => 
  apiCall(endpoint, { ...options, method: 'PUT', body });

export const apiPatch = (endpoint, body = null, options = {}) => 
  apiCall(endpoint, { ...options, method: 'PATCH', body });

export const apiDelete = (endpoint, options = {}) => 
  apiCall(endpoint, { ...options, method: 'DELETE' });
