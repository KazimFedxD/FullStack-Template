// src/config/app.js
// Application configuration - Customize these values for your project

export const APP_CONFIG = {
  // App Information
  name: "Your App Name",
  description: "A modern full-stack application",
  version: "1.0.0",
  
  // Branding
  logo: {
    text: "Your App Name", // Text shown in navbar
    url: "/", // Click destination
  },
  
  // API Configuration
  api: {
    baseUrl: process.env.REACT_APP_API_URL || "",
    timeout: 10000,
    endpoints: {
      login: "/api/auth/login/",
      register: "/api/auth/register/",
      verify: "/api/auth/verify/",
      logout: "/api/auth/logout/",
      checkAuth: "/api/auth/user/authenticated/",
      refreshToken: "/api/auth/token/refresh/",
    }
  },
  
  // Navigation Menu Items
  navigation: {
    // Public navigation items (shown when not logged in)
    public: [
      { name: "Home", href: "/", icon: null },
      { name: "About", href: "/about", icon: null },
    ],
    // Authenticated navigation items (shown when logged in)
    authenticated: [
      { name: "Home", href: "/", icon: null },
      { name: "Dashboard", href: "/dashboard", icon: null },
    ],
    // User dropdown menu items
    userMenu: [
      { name: "Profile", href: "/profile" },
      { name: "Settings", href: "/settings" },
      // Logout is automatically added
    ]
  },
  
  // Theme Configuration
  theme: {
    // Background gradient colors (CSS color values)
    background: {
      from: "gray-950",
      via: "slate-900", 
      to: "black"
    },
    // Primary colors for buttons, links, etc.
    colors: {
      primary: {
        main: "indigo-600",
        hover: "indigo-500",
        focus: "indigo-400"
      },
      secondary: {
        main: "pink-600", 
        hover: "pink-500",
        focus: "pink-400"
      }
    }
  },
  
  // Features toggles
  features: {
    registration: true,
    emailVerification: true,
    passwordReset: true,
    rememberMe: true,
    socialLogin: false,
  },
  
  // Default redirects
  redirects: {
    afterLogin: "/",
    afterLogout: "/auth",
    afterRegistration: "/verify",
    unauthorized: "/auth"
  },
  
  // Validation rules
  validation: {
    password: {
      minLength: 8,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false
    },
    username: {
      minLength: 3,
      maxLength: 30,
      allowSpecialChars: false
    }
  }
};

// Utility function to get nested config values
export const getConfig = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], APP_CONFIG);
};

export default APP_CONFIG;
