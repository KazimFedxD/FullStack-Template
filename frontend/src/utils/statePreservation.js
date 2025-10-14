// src/utils/statePreservation.js

/**
 * Utilities for preserving important state across page navigation
 * Since we're using window.location.href, we lose React state on navigation
 */

// Preserve important state before navigation
export const preserveState = (key, data) => {
  try {
    const timestamp = Date.now();
    const stateData = {
      data,
      timestamp,
      ttl: 5 * 60 * 1000 // 5 minutes TTL
    };
    localStorage.setItem(`preserved_${key}`, JSON.stringify(stateData));
  } catch (error) {
    console.error('Failed to preserve state:', error);
  }
};

// Restore preserved state
export const restoreState = (key) => {
  try {
    const stored = localStorage.getItem(`preserved_${key}`);
    if (!stored) return null;
    
    const stateData = JSON.parse(stored);
    const now = Date.now();
    
    // Check if data has expired
    if (now - stateData.timestamp > stateData.ttl) {
      localStorage.removeItem(`preserved_${key}`);
      return null;
    }
    
    // Remove after restoring to avoid stale data
    localStorage.removeItem(`preserved_${key}`);
    return stateData.data;
  } catch (error) {
    console.error('Failed to restore state:', error);
    return null;
  }
};

// Preserve form data
export const preserveFormData = (formId, formData) => {
  preserveState(`form_${formId}`, formData);
};

// Restore form data
export const restoreFormData = (formId) => {
  return restoreState(`form_${formId}`);
};

// Preserve weather data to avoid refetching
export const preserveWeatherData = (weatherData) => {
  preserveState('weather', weatherData);
};

// Restore weather data
export const restoreWeatherData = () => {
  return restoreState('weather');
};

// Preserve search/filter state
export const preserveSearchState = (searchData) => {
  preserveState('search', searchData);
};

// Restore search state
export const restoreSearchState = () => {
  return restoreState('search');
};

// Preserve user preferences temporarily
export const preserveUserPreferences = (preferences) => {
  preserveState('user_preferences', preferences);
};

// Restore user preferences
export const restoreUserPreferences = () => {
  return restoreState('user_preferences');
};

// Clear all preserved state (useful for logout)
export const clearAllPreservedState = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('preserved_')) {
      localStorage.removeItem(key);
    }
  });
};

// Auto-save form data as user types
export const setupAutoSave = (formElement, formId, interval = 2000) => {
  if (!formElement) return;
  
  let saveTimeout;
  
  const autoSave = () => {
    const formData = new FormData(formElement);
    const data = Object.fromEntries(formData.entries());
    preserveFormData(formId, data);
  };
  
  formElement.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(autoSave, interval);
  });
  
  // Mark form as having changes
  formElement.addEventListener('input', () => {
    formElement.dataset.hasChanges = 'true';
  });
  
  // Clear changes flag on submit
  formElement.addEventListener('submit', () => {
    formElement.dataset.hasChanges = 'false';
  });
  
  return () => {
    clearTimeout(saveTimeout);
    formElement.removeEventListener('input', autoSave);
  };
};
