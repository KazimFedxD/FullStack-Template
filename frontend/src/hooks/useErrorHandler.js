import { useState, useCallback } from 'react';
import { ERROR_TYPES } from '../utils/errorHandler';

export const useErrorHandler = () => {
  const [error, setError] = useState(null);

  const showError = useCallback((errorInfo, retryCallback = null) => {
    setError({
      ...errorInfo,
      onRetry: retryCallback,
      timestamp: Date.now()
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleApiError = useCallback((apiResponse, retryCallback = null) => {
    if (!apiResponse.ok && apiResponse.error) {
      showError(apiResponse.error, retryCallback);
      return true; // Error was handled
    }
    return false; // No error
  }, [showError]);

  const handleError = useCallback((error, context = '', retryCallback = null) => {
    const errorInfo = {
      type: ERROR_TYPES.SERVER,
      title: 'Error',
      message: error.message || 'An unexpected error occurred',
      canRetry: !!retryCallback
    };
    showError(errorInfo, retryCallback);
  }, [showError]);

  return {
    error,
    showError,
    clearError,
    handleApiError,
    handleError
  };
};
