// Centralized error handling utilities - generic for all websites

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
      message: error?.message || 'Something went wrong. Please try again.',
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

  if (status === 429) {
    return {
      type: ERROR_TYPES.SERVER,
      title: 'Too Many Requests',
      message: 'Please slow down. Try again in a few moments.',
      canRetry: true
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
    
    // New standardized backend error format (utils/error_handler.py)
    if (data.error && typeof data.error === 'object') {
      const error = data.error;
      let message = error.message || 'An error occurred';
      
      // Add details if available
      if (error.details) {
        if (typeof error.details === 'string') {
          message += ` (${error.details})`;
        } else if (error.details.validation_errors) {
          // Parse validation errors
          const validationErrors = parseValidationErrors(error.details.validation_errors);
          message = validationErrors;
        } else if (Object.keys(error.details).length > 0) {
          // Show first detail
          const firstDetail = Object.values(error.details)[0];
          if (typeof firstDetail === 'string') {
            message += ` (${firstDetail})`;
          }
        }
      }
      
      return message;
    }
    
    // Django REST Framework error formats
    if (data.error) return data.error;
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    
    // Validation errors
    if (data.non_field_errors) return data.non_field_errors[0];
    
    // Field-specific errors (DRF serializer errors)
    const fieldErrors = Object.keys(data).filter(key => 
      Array.isArray(data[key]) && data[key].length > 0
    );
    if (fieldErrors.length > 0) {
      const field = fieldErrors[0];
      const fieldName = formatFieldName(field);
      return `${fieldName}: ${data[field][0]}`;
    }

    return 'An error occurred';
  } catch (e) {
    return 'Unable to parse error response';
  }
};

// Parse validation errors into readable format
const parseValidationErrors = (errors) => {
  if (typeof errors === 'string') return errors;
  
  if (Array.isArray(errors)) {
    return errors.join(', ');
  }
  
  if (typeof errors === 'object') {
    const messages = [];
    for (const [field, fieldErrors] of Object.entries(errors)) {
      const fieldName = formatFieldName(field);
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach(err => {
          if (field === 'non_field_errors') {
            messages.push(err);
          } else {
            messages.push(`${fieldName}: ${err}`);
          }
        });
      } else {
        messages.push(`${fieldName}: ${fieldErrors}`);
      }
    }
    return messages.join('; ') || 'Validation error occurred';
  }
  
  return 'Validation error occurred';
};

// Format field names for display (snake_case to Title Case)
const formatFieldName = (field) => {
  if (field === 'non_field_errors') return 'Error';
  return field
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Create error object from response
export const createErrorFromResponse = async (error, response) => {
  const baseError = parseBackendError(error, response);
  
  if (response) {
    try {
      const message = await extractErrorMessage(response);
      return { ...baseError, message };
    } catch (e) {
      // If message extraction fails, return base error
      return baseError;
    }
  }
  
  return baseError;
};

// Format error for display to user
export const formatErrorForDisplay = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.title) return error.title;
  return 'An error occurred';
};

// Log error to console (can be extended to send to logging service)
export const logError = (error, context = '') => {
  const errorMessage = context ? `[${context}] ${error}` : error;
  console.error(errorMessage, error);
  
  // TODO: Send to logging service (Sentry, etc.)
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { context });
  // }
};
