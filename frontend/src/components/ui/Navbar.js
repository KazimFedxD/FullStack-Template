import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { navigateWithLoading } from "../../utils/navigation";
import { clearAllPreservedState } from "../../utils/statePreservation";
import { apiClient } from "../../utils/apiClient";
import { clearAllCookies } from "../../utils/auth";
import { APP_CONFIG } from "../../config/app";

export default function Navbar() {
  const { isAuthenticated, logout: authLogout } = useAuth();

  const handleLogout = async () => {
    try {
      // Call logout API endpoint (cookies will be cleared by backend)
      await apiClient(APP_CONFIG.api.endpoints.logout, {
        method: 'POST',
        requireAuth: true
      });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local state and cookies, regardless of API response
      authLogout();
      clearAllPreservedState();
      clearAllCookies(); // Clear any accessible cookies
      
      // Force reload to ensure clean state
      window.location.href = APP_CONFIG.redirects.afterLogout;
    }
  };

  const navItems = isAuthenticated 
    ? APP_CONFIG.navigation.authenticated 
    : APP_CONFIG.navigation.public;

  return (
    <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/30 backdrop-blur-xl border border-white/10 text-white shadow-md rounded-xl w-[95%] max-w-7xl">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a 
            href={APP_CONFIG.logo.url}
            className="text-xl font-bold tracking-wide text-white hover:text-white/80 transition-colors"
          >
            {APP_CONFIG.logo.text}
          </a>

          {/* Nav Links */}
          <div className="flex items-center">
            <nav className="hidden md:flex space-x-4 mr-4 text-sm">
              {navItems.map((item, index) => (
                <a 
                  key={index}
                  className="hover:text-indigo-300 transition-colors" 
                  href={item.href}
                >
                  {item.name}
                </a>
              ))}
            </nav>

            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="relative group">
                <button
                  aria-haspopup="true"
                  className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center ring-1 ring-white/20 hover:bg-black/40 focus:outline-none transition"
                  title="User menu"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A9 9 0 1118.88 6.196 9 9 0 015.12 17.804zm6.879-7.804a3 3 0 100-6 3 3 0 000 6z"/>
                  </svg>
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-black/30 backdrop-blur-xl text-white rounded-lg shadow-lg ring-1 ring-black/20 z-20 hidden group-hover:block">
                  {APP_CONFIG.navigation.userMenu.map((item, index) => (
                    <a 
                      key={index}
                      className="block px-4 py-2 hover:bg-white/10 transition" 
                      href={item.href}
                    >
                      {item.name}
                    </a>
                  ))}
                  <a
                    className="block px-4 py-2 hover:bg-white/10 border-t border-white/20 transition cursor-pointer"
                    onClick={handleLogout}
                  >
                    Sign out
                  </a>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigateWithLoading(APP_CONFIG.redirects.unauthorized)}
                className="w-full flex items-center px-4 py-3 text-left text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="w-5 h-5 mr-3" />
                Account
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
