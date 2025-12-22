// Authentication utilities - generic for all websites

// API Endpoints - relative paths for Nginx proxy
const API_ENDPOINTS = {
  login: '/api/auth/login/',
  register: '/api/auth/register/',
  verify: '/api/auth/verify/',
  logout: '/api/auth/logout/',
  checkAuth: '/api/auth/user/authenticated/',
  refreshToken: '/api/auth/token/refresh/',
  profile: '/api/auth/user/profile/',
};

// Save user info (tokens are now in httpOnly cookies)
export function saveAuthData({ user_id, user_email, username }) {
  localStorage.setItem('user_id', user_id);
  localStorage.setItem('user_email', user_email);
  if (username) {
    localStorage.setItem('username', username);
  }
}

// Clear user data (cookies are cleared by backend)
export function clearAuthData() {
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_email');
  localStorage.removeItem('username');
}

// Get user data from localStorage
export function getUserData() {
  const userId = localStorage.getItem('user_id');
  const userEmail = localStorage.getItem('user_email');
  const username = localStorage.getItem('username');
  
  if (userId && userEmail) {
    return { id: userId, email: userEmail, username };
  }
  return null;
}

// Clear all accessible cookies (this won't clear httpOnly cookies)
export function clearAllCookies() {
  // Get all cookies
  const cookies = document.cookie.split(';');
  
  // Clear each cookie with multiple domain/path combinations
  for (let cookie of cookies) {
    const eqPos = cookie.indexOf('=');
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
    const response = await fetch(API_ENDPOINTS.checkAuth, {
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
          user_email: userData.user_email,
          username: userData.username
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
      const refreshResponse = await fetch(API_ENDPOINTS.refreshToken, {
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
    const response = await fetch(API_ENDPOINTS.refreshToken, {
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

// Logout user
export async function logoutUser() {
  try {
    await fetch(API_ENDPOINTS.logout, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    // Even if logout API fails, clear local data
    console.error('Logout API error:', error);
  } finally {
    clearAuthData();
    clearAllCookies();
  }
}

// Export API configuration for use in other modules
export const AUTH_API = {
  endpoints: API_ENDPOINTS
};

// Fetch user profile from backend
export async function fetchUserProfile() {
  try {
    const response = await fetch(API_ENDPOINTS.profile, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      // Update local storage with fresh profile data
      if (data.user_id && data.user_email) {
        saveAuthData({
          user_id: data.user_id,
          user_email: data.user_email,
          username: data.username
        });
      }
      return { ok: true, data };
    } else {
      return { ok: false, error: 'Failed to fetch profile' };
    }
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
