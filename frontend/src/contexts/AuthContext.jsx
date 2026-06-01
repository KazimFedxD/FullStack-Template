// AuthContext - manages authentication state across the app

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAccessToken, clearAuthData, logoutUser, getUserData, saveAuthData, fetchUserProfile } from '../utils/auth';
import { useMessages } from './MessageContext';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { showError } = useMessages();

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      // Small delay to ensure cookies are properly set after login
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const token = await getAccessToken();
      
      // Get user info from localStorage
      const userData = getUserData();
      
      // Only consider authenticated if we have BOTH token AND user data
      if (token && userData) {
        setIsAuthenticated(true);
        setUser(userData);
        
        // Fetch fresh profile data from backend to ensure username is up to date
        const profileResult = await fetchUserProfile();
        if (profileResult.ok && profileResult.data) {
          setUser(profileResult.data);
        } else if (!profileResult.ok && profileResult.error) {
          showError({
            title: 'Profile Sync Failed',
            message: typeof profileResult.error === 'string'
              ? profileResult.error
              : 'We could not refresh your profile data right now.',
          });
        }
      } else {
        // Either no token or no user data - clear everything and set as unauthenticated
        setIsAuthenticated(false);
        setUser(null);
        if (!userData) {
          clearAuthData(); // Clear any partial data
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      showError({
        title: 'Session Check Failed',
        message: 'We could not confirm your session. Please sign in again.',
      });
      setIsAuthenticated(false);
      setUser(null);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  const login = useCallback((authData) => {
    // Save auth data to localStorage
    const userId = authData.user_id || authData.id;
    const userEmail = authData.user_email || authData.email;
    const username = authData.username;

    saveAuthData({
      user_id: userId,
      user_email: userEmail,
      username
    });
    
    setIsAuthenticated(true);
    setUser({ 
      id: userId, 
      email: userEmail,
      username
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
      showError({
        title: 'Logout Failed',
        message: 'We could not end the session cleanly. Your local session data was cleared anyway.',
      });
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      // Force a re-check after logout
      setTimeout(() => {
        checkAuth();
      }, 100);
    }
  }, [checkAuth, showError]);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for storage events (for multi-tab sync)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user_id' || e.key === 'user_email') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuth]);

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
