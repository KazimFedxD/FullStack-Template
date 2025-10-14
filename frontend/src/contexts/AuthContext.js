// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAccessToken, clearAuthData } from '../utils/auth';

const AuthContext = createContext();

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

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      // Small delay to ensure cookies are properly set after login
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const token = await getAccessToken();
      if (token) {
        setIsAuthenticated(true);
        // Get user info from localStorage
        const userId = localStorage.getItem('user_id');
        const userEmail = localStorage.getItem('user_email');
        if (userId && userEmail) {
          setUser({ id: userId, email: userEmail });
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (authData) => {
    setIsAuthenticated(true);
    setUser({ 
      id: authData.user_id, 
      email: authData.user_email 
    });
  };

  const logout = () => {
    clearAuthData();
    setIsAuthenticated(false);
    setUser(null);
    // Force a re-check after logout
    setTimeout(() => {
      checkAuth();
    }, 100);
  };

  useEffect(() => {
    checkAuth();
  }, []);

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
