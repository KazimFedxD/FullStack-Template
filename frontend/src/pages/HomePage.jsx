import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

function HomePage() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, isLoading, user });
  }, [isAuthenticated, isLoading, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            Welcome to <span className="bg-gradient-to-r from-blue-400 to-green-400 text-transparent bg-clip-text">FullStack Template</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            A modern, production-ready full-stack web application template
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <FeatureCard
            title="🚀 React 19 + Vite"
            description="Modern frontend with fast refresh and optimized builds"
          />
          <FeatureCard
            title="🔒 JWT Authentication"
            description="Secure authentication with httpOnly cookies"
          />
          <FeatureCard
            title="⚡ Django REST Framework"
            description="Robust backend API with powerful ORM"
          />
          <FeatureCard
            title="🎨 Tailwind CSS"
            description="Beautiful, responsive designs with utility-first CSS"
          />
          <FeatureCard
            title="🐳 Docker Ready"
            description="Containerized for easy development and deployment"
          />
          <FeatureCard
            title="📦 Generic & Reusable"
            description="Clean architecture ready for any project"
          />
        </div>

        {/* Auth Status */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Status</h2>
          {isLoading ? (
            <p className="text-gray-300">Checking authentication...</p>
          ) : isAuthenticated ? (
            <div>
              <p className="text-green-400 mb-2">✓ Authenticated</p>
              {user && (
                <div className="text-gray-300 mb-4">
                  <p>Email: {user.email}</p>
                  {user.username && <p>Username: {user.username}</p>}
                </div>
              )}
              <button
                onClick={logout}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-300 mb-4">Not authenticated</p>
              <div className="flex gap-4">
                <a
                  href="/api/auth/login/"
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors inline-block"
                >
                  Login
                </a>
                <a
                  href="/api/auth/register/"
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors inline-block"
                >
                  Register
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Get Started */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Build?</h3>
          <p className="text-gray-300 mb-6">
            This template includes everything you need to start building your full-stack application.
            Check out the README for setup instructions and documentation.
          </p>
          <a
            href="https://github.com/yourusername/fullstack-template"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 hover:border-white/40 transition-all hover:transform hover:scale-105">
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}

export default HomePage;
