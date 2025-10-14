// src/utils/navigation.js

/**
 * Navigation utility for handling page transitions without React Router
 */

// Basic navigation function
export const navigateTo = (path, options = {}) => {
  if (options.replace) {
    window.location.replace(path);
  } else {
    window.location.href = path;
  }
};

// Navigate with user confirmation (useful for forms with unsaved changes)
export const navigateWithConfirmation = (
  path, 
  message = "Are you sure? You may lose unsaved changes."
) => {
  if (window.confirm(message)) {
    navigateTo(path);
  }
};

// Navigate with loading indicator
export const navigateWithLoading = (path) => {
  // Show loading cursor
  document.body.style.cursor = 'wait';
  
  // Add loading class to body for potential CSS animations
  document.body.classList.add('navigating');
  
  // Navigate
  window.location.href = path;
};

// Navigate with delay (useful for showing success messages)
export const navigateWithDelay = (path, delay = 1500, message = null) => {
  setTimeout(() => {
    navigateTo(path);
  }, delay);
};

// Check if navigation is safe (no unsaved changes)
export const isSafeToNavigate = () => {
  // Check for any forms with unsaved changes
  const forms = document.querySelectorAll('form');
  for (let form of forms) {
    if (form.dataset.hasChanges === 'true') {
      return false;
    }
  }
  return true;
};

// Safe navigation that checks for unsaved changes
export const safeNavigate = (path, customMessage = null) => {
  if (isSafeToNavigate()) {
    navigateTo(path);
  } else {
    const message = customMessage || "You have unsaved changes. Are you sure you want to leave?";
    navigateWithConfirmation(path, message);
  }
};

// Get current page name from pathname
export const getCurrentPage = () => {
  const path = window.location.pathname;
  switch (path) {
    case '/':
      return 'home';
    case '/account':
      return 'auth';
    case '/verify':
      return 'verify';
    case '/preferences':
      return 'preferences';
    case '/daily-subscriptions':
      return 'subscriptions';
    case '/daily-subscriptions/create':
      return 'create-subscription';
    default:
      return 'unknown';
  }
};
