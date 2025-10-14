// Centralized error handling utilities

export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTH: 'authentication',
  VALIDATION: 'validation',
  SERVER: 'server',
  TIMEOUT: 'timeout',
  PARSE: 'parse'
};

// Parse backend error responses to user-friendly messages
export const parseBackendError = (error, response = null) => {
  // Network errors
  if (!navigator.onLine) {
    return {
      type: ERROR_TYPES.NETWORK,
      title: 'Connection Error',
      message: 'You appear to be offline. Please check your internet connection.',
      canRetry: true
    };
  }

  // Request timeout
  if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
    return {
      type: ERROR_TYPES.TIMEOUT,
      title: 'Request Timeout',
      message: 'The request took too long. Please try again.',
      canRetry: true
    };
  }

  // Network/fetch errors
  if (error?.name === 'TypeError' || error?.message?.includes('fetch')) {
    return {
      type: ERROR_TYPES.NETWORK,
      title: 'Network Error',
      message: 'Unable to connect to the server. Please check your connection and try again.',
      canRetry: true
    };
  }

  if (!response) {
    return {
      type: ERROR_TYPES.SERVER,
      title: 'Unexpected Error',
      message: 'Something went wrong. Please try again.',
      canRetry: true
    };
  }

  // Parse response-based errors
  const status = response.status;
  
  if (status === 401) {
    return {
      type: ERROR_TYPES.AUTH,
      title: 'Authentication Required',
      message: 'Please log in to continue.',
      canRetry: false
    };
  }

  if (status === 403) {
    return {
      type: ERROR_TYPES.AUTH,
      title: 'Access Denied',
      message: 'You don\'t have permission to perform this action.',
      canRetry: false
    };
  }

  if (status === 404) {
    return {
      type: ERROR_TYPES.SERVER,
      title: 'Not Found',
      message: 'The requested resource was not found.',
      canRetry: false
    };
  }

  if (status >= 500) {
    return {
      type: ERROR_TYPES.SERVER,
      title: 'Server Error',
      message: 'The server is experiencing issues. Please try again later.',
      canRetry: true
    };
  }

  if (status >= 400) {
    return {
      type: ERROR_TYPES.VALIDATION,
      title: 'Request Error',
      message: 'There was an issue with your request. Please check your input and try again.',
      canRetry: false
    };
  }

  return {
    type: ERROR_TYPES.SERVER,
    title: 'Unknown Error',
    message: 'An unexpected error occurred. Please try again.',
    canRetry: true
  };
};

// Extract error message from backend response
export const extractErrorMessage = async (response) => {
  try {
    const data = await response.json();
    
    // Django REST Framework error formats
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    
    // Validation errors
    if (data.non_field_errors) return data.non_field_errors[0];
    
    // Field-specific errors
    const fieldErrors = Object.keys(data).filter(key => 
      Array.isArray(data[key]) && data[key].length > 0
    );
    if (fieldErrors.length > 0) {
      return `${fieldErrors[0]}: ${data[fieldErrors[0]][0]}`;
    }

    return 'An error occurred';
  } catch (e) {
    return 'Unable to parse error response';
  }
};

// Create standardized error object with backend message
export const createErrorFromResponse = async (error, response) => {
  const baseError = parseBackendError(error, response);
  
  if (response) {
    try {
      const backendMessage = await extractErrorMessage(response);
      // Use backend message if it's more specific
      if (backendMessage && backendMessage !== 'An error occurred') {
        baseError.message = backendMessage;
      }
    } catch (e) {
      // Keep the default message if we can't parse backend response
    }
  }
  
  return baseError;
};

// Log errors for debugging
export const logError = (error, context = '') => {
  console.error(`[Error ${context}]:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    online: navigator.onLine,
    context
  });
};
