// src/utils/auth.js
import { APP_CONFIG } from '../config/app';

// Save user info (tokens are now in httpOnly cookies)
export function saveAuthData({ user_id, user_email }) {
  localStorage.setItem("user_id", user_id);
  localStorage.setItem("user_email", user_email);
}

// Clear user data (cookies are cleared by backend)
export function clearAuthData() {
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_email");
}

// Clear all accessible cookies (this won't clear httpOnly cookies)
export function clearAllCookies() {
  // Get all cookies
  const cookies = document.cookie.split(";");
  
  // Clear each cookie with multiple domain/path combinations
  for (let cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    if (name) {
      // Try different combinations of domain and path
      const clearPatterns = [
        `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`,
        `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`,
        `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`,
        `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost`,
        `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.localhost`,
      ];
      
      clearPatterns.forEach(pattern => {
        document.cookie = pattern;
      });
    }
  }
  
  // Also try to clear specific known cookie names
  const knownCookies = ['access_token', 'refresh_token', 'csrftoken', 'sessionid'];
  knownCookies.forEach(cookieName => {
    const clearPatterns = [
      `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`,
      `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`,
      `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`,
    ];
    
    clearPatterns.forEach(pattern => {
      document.cookie = pattern;
    });
  });
}

// Check if user is authenticated by calling the backend
export async function getAccessToken() {
  try {
    const response = await fetch(`${APP_CONFIG.api.baseUrl}${APP_CONFIG.api.endpoints.checkAuth}`, {
      method: 'GET',
      credentials: 'include' // Include cookies
    });
    
    if (response.ok) {
      // Check if we have user data in localStorage as well
      const userId = localStorage.getItem('user_id');
      const userEmail = localStorage.getItem('user_email');
      
      // Parse response to check if backend returned user data
      let userData = null;
      try {
        userData = await response.json();
      } catch (e) {
        // Response might not be JSON, that's okay
      }
      
      // Only consider authenticated if we have both backend confirmation AND user data
      if (userData && userData.user_id && userData.user_email) {
        // Save user data from backend response
        saveAuthData({
          user_id: userData.user_id,
          user_email: userData.user_email
        });
        return 'authenticated';
      } else if (userId && userEmail) {
        // We have local user data, trust the backend response
        return 'authenticated';
      } else {
        // Backend says OK but no user data - clear auth and return null
        clearAuthData();
        return null;
      }
    } else if (response.status === 401) {
      // Try to refresh token
      const refreshResponse = await fetch(`${APP_CONFIG.api.baseUrl}${APP_CONFIG.api.endpoints.refreshToken}`, {
        method: 'POST',
        credentials: 'include' // Include cookies
      });
      
      if (refreshResponse.ok) {
        // Token refreshed successfully, but verify we have user data
        const userId = localStorage.getItem('user_id');
        const userEmail = localStorage.getItem('user_email');
        
        if (userId && userEmail) {
          return 'authenticated';
        } else {
          // No user data even after refresh
          clearAuthData();
          return null;
        }
      } else {
        // Refresh failed, user needs to login
        clearAuthData();
        return null;
      }
    } else {
      // Other error
      clearAuthData();
      return null;
    }
  } catch (error) {
    // Network error or other issue
    clearAuthData();
    return null;
  }
}

// Refresh access token (now handled by cookies)
export async function refreshAccessToken() {
  try {
    const response = await fetch(`${APP_CONFIG.api.baseUrl}${APP_CONFIG.api.endpoints.refreshToken}`, {
      method: 'POST',
      credentials: 'include' // Include cookies
    });
    
    if (response.ok) {
      return 'authenticated';
    } else {
      clearAuthData();
      return null;
    }
  } catch (error) {
    clearAuthData();
    return null;
  }
}
